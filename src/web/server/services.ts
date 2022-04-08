import { PrismaClient } from '@prisma/client'
import { ConfigLite } from '../../util'
import { Server } from './types'

const getServer = async (serverid: string): Promise<Server> => {
    const prisma = new PrismaClient()
    const bot = await prisma.bot.findUnique({
        where: {
            serverid: serverid
        }
    })
    if(!bot) throw new Error('failed to grab bot')
    const { name, bio }: ConfigLite = bot.config as unknown as ConfigLite
    const { serveravatar } = bot
    await prisma.$disconnect()
    return { id: bot.serverid, name, bio, avatar: serveravatar }
}

const getTopUsers = async (serverid: string, num: number) => {
    const prisma = new PrismaClient()
    const users = await prisma.user.findMany({
        where: {
            Rep: {
                some: {
                    serverid: serverid
                },
            }
        },
        select: {
            id: true,
            discordid: true,
            Rep: {
                select: {
                    rep: true
                },
                orderBy: {
                    rep: 'desc'
                }
            }
        },
        take: num
    })
    if(users == null) throw new Error('failed to grab users')
    await prisma.$disconnect()
    return users
}

const getActivityForDay = async (serverid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            serverid: serverid,
            time: {
                gte: new Date(new Date().setDate(new Date().getDate() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

const getActivityForMonth = async (serverid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            serverid: serverid,
            time: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

const getActivityForYear = async (serverid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            serverid: serverid,
            time: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

export default {
    getServer,
    getTopUsers,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}
