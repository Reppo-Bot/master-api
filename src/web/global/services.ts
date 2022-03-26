import { PrismaClient, SessionArchive } from "@prisma/client"
import { AuthCreds, DiscordUser } from "../../util"

const login = async (creds: AuthCreds) => {
    // make request to discord api for user with given token
    const { token, ip } = creds
    const discorduser: DiscordUser = await fetch(`https://discord.com/api/v9/users/@me`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    }).then(res => res.json())
    if(!discorduser) throw new Error('failed to grab user')

    const prisma = new PrismaClient()
    // check if user exists in database
    const user = await prisma.user.findUnique({ where: { discordid: discorduser.id } })
    if(!user) throw new Error('user does not have reppo account')

    const sessions = await prisma.session.findMany({ where: { userid: user.id } })

    if(sessions && sessions.length > 0) {
        // sign out all other sessions and archive them
        const archivedSessions = await prisma.sessionArchive.createMany({ data: sessions.map(session => session as SessionArchive), skipDuplicates: true })
        if(!archivedSessions || archivedSessions.count !== sessions.length) throw new Error('failed to archive sessions')
        await prisma.session.deleteMany({ where: { userid: user.id } })
    }

    // create new session
    const session = await prisma.session.create({ data: { userid: user.id, token: token, ip: ip, expiration: new Date(new Date().setHours(new Date().getHours() + 1)) } })
    if(!session) throw new Error('failed to create session for login')
    return {...session, discordid: user.discordid}
}

export default {
    login
}