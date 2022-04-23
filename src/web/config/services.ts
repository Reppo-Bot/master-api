import { PrismaClient, SessionArchive, Session, Bot } from "@prisma/client"
import axios from 'axios'
import { Command } from "../../bot/command/types"
import { AuthCreds, BASE_URL, ConfigLite } from "../../util"
import { discordCommandsCall } from '../../util/discord'
import { DiscordCommand, DiscordCommandOptionType, DiscordCommandType } from "./types"

const getValidSession = async (prisma: PrismaClient, creds: AuthCreds) => {
    const { token, ip } = creds
    const session = await prisma.session.findUnique({ where: { token: token } })
    if (!session) throw new Error('No one logged in with that token')
    if (session.ip !== ip) throw new Error('Invalid IP')
    // validate session
    if (new Date() > session.expiration) {
        await prisma.sessionArchive.create({ data: session as SessionArchive })
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

const registerCommands = async (bot: Bot, newConfig: ConfigLite) => {
    if (!bot) throw new Error('Invalid bot for registering commands')
    const { commands }: ConfigLite = bot.config as unknown as ConfigLite
    if (commands == null) throw new Error('No commands object found')

    // compare old and new commands
    const commandToAdd: string[] = []
    const commandToDelete: string[] = []
    const commandToUpdate: string[] = []

    for (const [name, command] of Object.entries(newConfig.commands)) {
        const oldCommand = commands.get(name)
        if (oldCommand) {
            if (oldCommand.type !== command.type || oldCommand.description !== command.description || oldCommand.permType !== command.permType) {
                commandToUpdate.push(name)
            }
        } else {
            commandToAdd.push(name)
        }
    }

    for (const [name, _] of Object.entries(commands)) {
        const other = newConfig.commands.get(name)
        if (!other) {
            commandToDelete.push(name)
        }
    }

    const command_url = `${BASE_URL}/applications/${process.env.APP_ID}/guilds/${bot.serverid}/commands`
    const headers = {
        'Authorization': `Bot ${process.env.TOKEN}`
    }

    try {
        for (const name of [...commandToAdd, ...commandToUpdate]) {
            const command = newConfig.commands.get(name)
            if (!command) throw new Error(`Could not find command ${name}`)
            const { description, type }: Command = command
            const discordCommand: DiscordCommand = { name, description, type: DiscordCommandType.CHAT_INPUT } as DiscordCommand
            discordCommand.options = []
            discordCommand.options.push({ type: DiscordCommandOptionType.USER, name: 'user', description: `User to ${name}`, required: type !== 'info' })
            switch (type) {
                case 'ban': case 'set':
                    discordCommand.options.push({ type: DiscordCommandOptionType.NUMBER, name: 'amount', description: `Amount`, required: type === 'set' })
                    if (type === 'ban') discordCommand.options.push({ type: DiscordCommandOptionType.STRING, name: 'reason', description: `Reason for ${name}`, required: false })
                    break
            }
            discordCommandsCall(axios, 'post', command_url, discordCommand)
            .then(res => {
                if (res.status !== 201 && res.status !== 200) throw new Error(`Could not register command ${name}`)
                console.log(`Registered command ${name}`)
            })
            .catch(err => {throw err})
        }

        for (const name of commandToDelete) {
            discordCommandsCall(axios, 'get', command_url, { headers })
            .then(data => data.data)
            .then((commands: DiscordCommand[]) => commands.filter(command => commandToDelete.includes(command.name)))
            .then(commands => {
                for (const command of commands) {
                    discordCommandsCall(axios, 'delete', `${command_url}/${command.id}`, { headers })
                    .then(res => {
                        if (res.status !== 200) throw new Error(`Could not delete command ${name}`)
                        console.log(`Deleted command ${name}`)
                    })
                    .catch(err => { throw err })
                }
            })
        }
    } catch (err) {
        // we reset everything back to the old config
        // delete all commands
        discordCommandsCall(axios, 'get', command_url, { headers })
        .then(data => data.data)
        .then(commands => {
            for (const command of commands) {
                discordCommandsCall(axios, 'delete', `${command_url}/${command.id}`, { headers })
                .then(res => {
                    if (res.status !== 200) throw new Error(`Could not delete command ${name}`)
                    console.log(`Deleted command ${name}`)
                })
                .catch(err => { throw err })
            }
        })
        .catch(err => { throw err })

        // add all old commands
        for (const [name, command] of Object.entries(commands)) {
            const { description, type }: Command = command
            const discordCommand: DiscordCommand = { name, description, type: DiscordCommandType.CHAT_INPUT } as DiscordCommand
            discordCommand.options = []
            discordCommand.options.push({ type: DiscordCommandOptionType.USER, name: 'user', description: `User to ${name}`, required: type !== 'info' })
            switch (type) {
                case 'ban': case 'set':
                    discordCommand.options.push({ type: DiscordCommandOptionType.NUMBER, name: 'amount', description: `Amount`, required: type === 'set' })
                    if (type === 'ban') discordCommand.options.push({ type: DiscordCommandOptionType.STRING, name: 'reason', description: `Reason for ${name}`, required: false })
                    break
            }
            discordCommandsCall(axios, 'post', command_url, discordCommand)
            .then(res => {
                if (res.status !== 201 && res.status !== 200) throw new Error(`Could not register command ${name}`)
                console.log(`Registered command ${name}`)
            })
            .catch(err => {throw err})
        }
        throw err
    }
}

const updateConfig = async (serverid: string, config: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const bot = await prisma.bot.findUnique({ where: { serverid: server.serverid } })
    if (!bot) throw new Error('Could not find server')
    await registerCommands(bot, JSON.parse(config) as ConfigLite)
    const newBot = await prisma.bot.update({
        where: { serverid: server.serverid },
        data: { config: config }
    })
    if (!newBot) throw new Error('Could not update config')
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
    if (!newBot) throw new Error('Could not create server')
    await prisma.$disconnect()
    return newBot
}

const removeServer = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const deletedBot = await prisma.bot.delete({ where: { serverid: server.serverid } })
    if (!deletedBot) throw new Error('Could not delete server')
    await prisma.$disconnect()
    return deletedBot
}

const getBots = async (creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const bots = await prisma.bot.findMany({ where: { ownerid: session.userid } })
    if (bots == null) throw new Error('Could not grab bots')
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
