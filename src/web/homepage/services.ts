import { PrismaClient } from "@prisma/client"

import { Server, Config } from '../server/types'

const getHourTransactions = async () => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            time: {
                gte: new Date(new Date().setHours(new Date().getHours() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    return transactions
}

const searchUsers = async (searchString: string) => {
    const prisma = new PrismaClient()
    const users = await prisma.user.findMany({
        where: {
            OR: [
                {
                    discordid: {
                        contains: searchString
                    }
                },
                {
                    id: {
                        contains: searchString
                    }
                }
            ]
        },
    })
    if(users == null) throw new Error('failed to grab users')
    return users
}

const searchServers = async (searchString: string): Promise<Server[]> => {
    const prisma = new PrismaClient()
    const bots = await prisma.bot.findMany()
    if(bots == null) throw new Error('failed to grab bot')
    const servers = bots.filter(bot => {
        if(bot.serverid.includes(searchString)) return true
        const { name } = bot.config as unknown as Config
        if(name.includes(searchString)) return true
        return false
    })
    if(servers == null) throw new Error('failed to grab servers')
    return servers.map(server => ({ id: server.serverid, name: (server.config as unknown as Config).name, bio: (server.config as unknown as Config).bio, avatar: server.serveravatar }))
}

const getTotalUserCount = async () => {
    const prisma = new PrismaClient()
    return await prisma.user.count()
}

const getTotalServerCount = async () => {
    const prisma = new PrismaClient()
    return await prisma.bot.count()
}

export default {
    getHourTransactions,
    searchUsers,
    searchServers,
    getTotalUserCount,
    getTotalServerCount
}
