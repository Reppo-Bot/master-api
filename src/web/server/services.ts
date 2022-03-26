import { PrismaClient } from '@prisma/client'
import { Config, Server } from './types'

const getServer = async (serverid: string): Promise<Server> => {
    const prisma = new PrismaClient()
    const bot = await prisma.bot.findUnique({
        where: {
            serverid: serverid
        }
    })
    if(!bot) throw new Error('failed to grab bot')
    const { name, bio }: Config = bot.config as unknown as Config
    const { serveravatar } = bot
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
    return transactions
}

export default {
    getServer,
    getTopUsers,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}
