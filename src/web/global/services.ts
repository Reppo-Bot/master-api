import { PrismaClient, SessionArchive } from "@prisma/client"
import axios from "axios"
import { AuthCreds, DiscordUser } from "../../util"

const login = async (creds: AuthCreds, timestamp: string) => {
    // make request to discord api for user with given token
    const { token, ip } = creds
    if(!token) throw new Error("No token provided")
    if(!ip) throw new Error("No ip provided")
    const discorduser: DiscordUser = await axios.get(`https://discord.com/api/v9/users/@me`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    })
    .then(res => res.data) as DiscordUser
    
    if(!discorduser) throw new Error('failed to grab user')
    console.log(discorduser)
    const prisma = new PrismaClient()
    // check if user exists in database
    const user = await prisma.user.findUnique({ where: { discordid: discorduser.id } }) ?? await prisma.user.create({
        data: {
            discordid: discorduser.id,
            name: discorduser.username,
            avatar: discorduser.avatar
        }
    })
    if(!user) throw new Error('Could not find or create user')

    const sessions = await prisma.session.findMany({ where: { userid: user.id } })

    if(sessions && sessions.length > 0) {
        // sign out all other sessions and archive them
        const archivedSessions = await prisma.sessionArchive.createMany({ data: sessions.map(session => session as SessionArchive)})
        console.log("archivedSessions", archivedSessions.count)
        console.log("sessions", sessions.length)
        if(!archivedSessions || archivedSessions.count !== sessions.length) throw new Error('failed to archive sessions')
        await prisma.session.deleteMany({ where: { userid: user.id } })
    }

    // create new session
    const session = await prisma.session.create({ data: { userid: user.id, token: token, ip: ip, expiration: new Date(timestamp) } })
    if(!session) throw new Error('failed to create session for login')
    console.log("successfully logged in")
    await prisma.$disconnect()
    return {...session, discordid: user.discordid}
}

const logout = async (token: string) => {
    const prisma = new PrismaClient()
    const session = await prisma.session.findUnique({where: { token: token }})
    if(!session) throw new Error('No session found')
    const archivedSession = await prisma.sessionArchive.create({ data: session as SessionArchive })
    if(!archivedSession) throw new Error('Failed to archive session')
    const deletedSession = await prisma.session.delete({ where: { token: token }})
    if(!deletedSession) throw new Error('Failed to delete session')
    await prisma.$disconnect()
    return deletedSession
}

export default {
    login,
    logout
}
