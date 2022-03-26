import { PrismaClient, SessionArchive, Session } from "@prisma/client"
import { AuthCreds } from "./types"

const getValidSession = async (prisma: PrismaClient, creds: AuthCreds) => {
    const { token, ip } = creds
    const session = await prisma.session.findUnique({ where: { token: token } })
    if (!session) throw new Error('No one logged in with that token')
    if (session.ip !== ip) throw new Error('Invalid IP') 
    // validate session
    if(new Date().getDate() > session.expiration.getDate()) {
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

const updateConfig = async (serverid: string, config: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const newBot = await prisma.bot.update({
        where: { serverid: server.serverid },
        data: { config: config }
    })
    if(!newBot) throw new Error('Could not update config')
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
    return newBot
}

const removeServer = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    const deletedBot = await prisma.bot.delete({ where: { serverid: server.serverid } })
    if(!deletedBot) throw new Error('Could not delete server')
    return deletedBot
}

const getBots = async (creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const bots = await prisma.bot.findMany({ where: { ownerid: session.userid } })
    if(bots == null) throw new Error('Could not grab bots')
    return bots
}

const getConfig = async (serverid: string, creds: AuthCreds) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, creds)
    const server = await getValidServer(prisma, serverid, session)
    return server.config
}

export default {
    updateConfig,
    addServer,
    removeServer,
    getBots,
    getConfig
}
