import { PrismaClient, SessionArchive, Session } from "@prisma/client"

const getValidSession = async (prisma: PrismaClient, token: string) => {
    const session = await prisma.session.findUnique({ where: { token: token } })
    if (!session) throw new Error('No one logged in with that token')
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

const updateConfig = async (serverid: string, config: string, token: string) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, token)
    const server = await getValidServer(prisma, serverid, session)
    const newBot = await prisma.bot.update({
        where: { serverid: server.serverid },
        data: { config: config }
    })
    if(!newBot) throw new Error('Could not update config')
    return newBot
}

const addServer = async (serverid: string, token: string, serveravatar: string) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, token)
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

const removeServer = async (serverid: string, token: string) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, token)
    const server = await getValidServer(prisma, serverid, session)
    const deletedBot = await prisma.bot.delete({ where: { serverid: server.serverid } })
    if(!deletedBot) throw new Error('Could not delete server')
    return deletedBot
}

const getBots = async (token: string) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, token)
    const bots = await prisma.bot.findMany({ where: { ownerid: session.userid } })
    if(bots == null) throw new Error('Could not grab bots')
    return bots
}

const getConfig = async (serverid: string, token: string) => {
    const prisma = new PrismaClient()
    const session = await getValidSession(prisma, token)
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
