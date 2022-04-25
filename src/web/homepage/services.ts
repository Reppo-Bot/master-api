import { PrismaClient } from "@prisma/client"

import { Server } from '../server/types'

import { ConfigLite } from "../../util"

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
    await prisma.$disconnect()
    return transactions
}

const searchUsers = async (searchString: string) => {
    const prisma = new PrismaClient()
    const users = await prisma.user.findMany({
        where: {
            name: {
                contains: searchString,
                mode: 'insensitive'
            }
        }
    })
    if(users == null) throw new Error('failed to grab users')
    await prisma.$disconnect()
    return users
}

const searchServers = async (searchString: string): Promise<Server[]> => {
    const prisma = new PrismaClient()
    const bots = await prisma.bot.findMany()
    if(bots == null) throw new Error('failed to grab bot')
    const servers = bots.filter(bot => {
        const { name } = bot.config as unknown as ConfigLite
        if(name.toLowerCase().includes(searchString.toLowerCase())) return true
        return false
    })
    if(servers == null) throw new Error('failed to grab servers')
    await prisma.$disconnect()
    return servers.map(server => ({ id: server.serverid, name: (server.config as unknown as ConfigLite).name, bio: (server.config as unknown as ConfigLite).bio, avatar: server.serveravatar }))
}

const getTotalUserCount = async () => {
    const prisma = new PrismaClient()
    const userCount = await prisma.user.count()
    await prisma.$disconnect()
    return userCount
}

const getTotalServerCount = async () => {
    const prisma = new PrismaClient()
    const botCount = await prisma.bot.count()
    await prisma.$disconnect()
    return botCount
}

export default {
    getHourTransactions,
    searchUsers,
    searchServers,
    getTotalUserCount,
    getTotalServerCount
}
