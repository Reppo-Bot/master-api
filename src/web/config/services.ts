import { PrismaClient, SessionArchive, Session, Bot } from "@prisma/client"
import { Command } from "../../bot/command/types"
import { AuthCreds, BASE_URL, ConfigLite, _objToMap} from "../../util"
import ampq from 'amqplib'

const getValidSession = async (prisma: PrismaClient, creds: AuthCreds) => {
    const { token, ip } = creds
    const session = await prisma.session.findUnique({ where: { token: token } })
    if (!session) throw new Error('No one logged in with that token')
    if (session.ip !== ip) throw new Error('Invalid IP')
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

const getUpdateStatus = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    await getValidSession(prisma, creds)
    const bot = await prisma.bot.findUnique({ where: { serverid: serverid } })
    if (!bot) throw new Error('No bot with that id')
    return bot.updateStatus
}

const successUpdate = async (serverid: string) => {
    const prisma = new PrismaClient()
    const bot = await prisma.bot.update(
        { 
            where: { 
                serverid: serverid 
            },
            data: {
                updateStatus: "success"
            } 
        })
    if (!bot) throw new Error('No bot with that id')
    return bot
}

const failUpdate = async (serverid: string) => {
    const prisma = new PrismaClient()
    const bot = await prisma.bot.update(
        { 
            where: { 
                serverid: serverid 
            },
            data: {
                updateStatus: "fail"
            } 
        })
    if (!bot) throw new Error('No bot with that id')
    return bot
}

const registerCommands = async (bot: Bot, newConfig: ConfigLite) => {
    if (!bot) throw new Error('Invalid bot for registering commands')
    const { commands }: ConfigLite = bot.config as unknown as ConfigLite
    if (commands == null) throw new Error('No commands object found')

    // compare old and new commands
    const commandToAdd: Command[] = []
    const commandToDelete: Command[] = []
    const commandToUpdate: Command[] = []
    for (const [name, command] of Object.entries(newConfig.commands)) {
        const oldCommand = _objToMap(commands).get(name)
        if (oldCommand) {
            if (oldCommand.type !== command.type || oldCommand.description !== command.description || oldCommand.permType !== command.permType) {
                commandToUpdate.push({name, ...command})
            }
        } else {
            commandToAdd.push({name, ...command})
        }
    }

    for (const [name] of Object.entries(commands)) {
        const other = _objToMap(newConfig.commands).get(name)
        if (!other) {
            commandToDelete.push({name, ...other})
        }
    }

    const connection = await ampq.connect("amqp://localhost")
    const channel = await connection.createChannel()
    channel.assertQueue("commands", { durable: true })
    if(channel.sendToQueue("commands", Buffer.from(JSON.stringify({
        code: 1,
        commandsToAdd: commandToAdd,
        commandsToDelete: commandToDelete,
        commandsToUpdate: commandToUpdate,
        oldCommands: commands,
        appId: process.env.APP_ID,
        serverId: bot.serverid,
        token: process.env.TOKEN,
        baseUrl: BASE_URL
    })))) {
        await channel.close()
        await connection.close()
        return "Update Request Received"
    } else {
        await channel.close()
        await connection.close()
        throw new Error('Could not send update request')
    }
}

const updateConfig = async (serverid: string, config: any, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const bot = await prisma.bot.findUnique({ where: { serverid: server.serverid } })
    if (!bot) throw new Error('Could not find server')
    await registerCommands(bot, config)
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
    getConfig,
    getUpdateStatus,
    successUpdate,
    failUpdate
}
