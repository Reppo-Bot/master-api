import { PrismaClient, SessionArchive, Session, Bot } from "@prisma/client"
import axios, { AxiosResponse } from "axios"

import { AuthCreds, BASE_URL, CommandLite, ConfigLite } from "../../util"
import { discordCommandsCall } from '../../util/discord'
import { DiscordCommand, DiscordCommandOption, DiscordCommandOptionType, DiscordCommandType } from "./types"

const getValidSession = async (prisma: PrismaClient, creds: AuthCreds) => {
    const { token, ip } = creds
    const session = await prisma.session.findUnique({ where: { token: token } })
    if (!session) throw new Error('No one logged in with that token')
    if (session.ip !== ip) throw new Error('Invalid IP')
    // validate session
    if(new Date() > session.expiration) {
        await prisma.sessionArchive.create({ data: session as SessionArchive})
        await prisma.session.delete({ where: { id: session.id } })
        throw new Error('Your session has expired, archiving')
    }
    return session
}

const getValidServer = async (prisma: PrismaClient, serverid: string, session: Session) => {
    const server = await prisma.bot.findUnique({ where: { serverid: serverid } })
    if (!server) throw new Error('No server with that id')
    if (server.ownerid !== session.userid) throw new Error('You do not own this server')
    return server
}

/*const discordCommandsCall = async (type: string, url: string, data?: any) => {
    const headers = {
        'Authorization': `Bot ${process.env.TOKEN}`
    }
    let res: AxiosResponse = {} as AxiosResponse

    switch(type) {
        case 'post':
            res = await axios.post(url, data, { headers })
            break
        case 'get':
            res = await axios.get(url, { headers })
            break
        case 'delete':
            res = await axios.delete(url, { headers })
            break
    }
    if(!res) throw new Error('No response from discord')

    if(res.headers['X-RateLimit-Remaining'] && res.headers['X-RateLimit-Remaining'] == '0') {
        console.log('Rate limit reached, waiting')
        await new Promise(resolve => setTimeout(resolve, parseFloat(res.headers['X-RateLimit-Reset-After']) ?? 0 ))
    }

    return res
}*/

const registerCommands = async (bot: Bot) => {
    if(!bot) throw new Error('Invalid bot for registering commands')
    const { commands }: ConfigLite = bot.config as unknown as ConfigLite
    if(commands == null) throw new Error('No commands object found')
    const command_url = `${BASE_URL}/applications/${process.env.APP_ID}/guilds/${bot.serverid}/commands`
    const headers = {
        'Authorization': `Bot ${process.env.TOKEN}`
    }

    const successfulCommands: string[] = []
    for (const [name, command] of Object.entries(commands)){
        const { description, type }: CommandLite = command
        const discordCommand: DiscordCommand = { name, description, type: DiscordCommandType.CHAT_INPUT} as DiscordCommand
        discordCommand.options = []
        discordCommand.options.push({ type: DiscordCommandOptionType.USER, name: 'user', description: `User to ${name}`, required: type !== 'info' })
        switch(type) {
            case 'ban': case 'set':
                discordCommand.options.push({ type: DiscordCommandOptionType.NUMBER, name: 'amount', description: `Amount`, required: type === 'set' })
                if(type === 'ban') discordCommand.options.push({ type: DiscordCommandOptionType.STRING, name: 'reason', description: `Reason for ${name}`, required: false })
                break
        }
        await discordCommandsCall('post', command_url, discordCommand)
        .then(res => {
            if(res.status !== 201 && res.status !== 200) throw new Error(`Could not register command ${name}`)
            console.log(`Registered command ${name}`)
            successfulCommands.push(name)
        })
        .catch(err => { throw err })
    }

    // only delete the ones that are no longer included in the config, ie the ones that were not successfully created
    await discordCommandsCall('get', command_url, { headers })
    .then(data => data.data)
    .then((commands: DiscordCommand[]) => commands.filter((command: DiscordCommand) => !successfulCommands.includes(command.name)))
    .then(async commands => commands.forEach(async (command: DiscordCommand) => { await discordCommandsCall('delete', command_url + '/' + command.id) }))
    .catch(err => {throw new Error(err) })
}

const updateConfig = async (serverid: string, config: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const newBot = await prisma.bot.update({
        where: { serverid: server.serverid },
        data: { config: config }
    })
    if(!newBot) throw new Error('Could not update config')
    await registerCommands(newBot)
    await prisma.$disconnect()
    return newBot
}

const addServer = async (serverid: string, serveravatar: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await prisma.bot.findUnique({ where: { serverid: serverid } })
    if (server) throw new Error('Server already registered with reppo')
    const newBot = await prisma.bot.create({
        data: {
            serverid: serverid,
            ownerid: session.userid,
            config: '{}',
            serveravatar: serveravatar
        }
    })
    if(!newBot) throw new Error('Could not create server')
    await prisma.$disconnect()
    return newBot
}

const removeServer = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const deletedBot = await prisma.bot.delete({ where: { serverid: server.serverid } })
    if(!deletedBot) throw new Error('Could not delete server')
    await prisma.$disconnect()
    return deletedBot
}

const getBots = async (creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const bots = await prisma.bot.findMany({ where: { ownerid: session.userid } })
    if(bots == null) throw new Error('Could not grab bots')
    await prisma.$disconnect()
    return bots
}

const getConfig = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    await prisma.$disconnect()
    return server.config
}

export default {
    updateConfig,
    addServer,
    removeServer,
    getBots,
    getConfig
}
