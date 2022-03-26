import { PrismaClient } from '@prisma/client'

const getUser = async (discordid: string) => {
    const prisma = new PrismaClient()
    // get the user from the db
    const user = await prisma.user.findUnique({ where: { discordid: discordid }})
    if(!user) throw new Error('Failed to find specified user')
    return user
}

const getReps = async (userid: string) => {
    const prisma = new PrismaClient()
    const reps = await prisma.rep.findMany({ where: {userid: userid}})
    if(reps == null) throw new Error('Failed to grab reps')
    return reps
}

const getRecentTransactions = async (userid: string, num: number) => {
    const prisma = new PrismaClient()
    if(num <= 0) throw new Error("Please specify a number greater than 0")
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: userid
                },
                {
                    receiverid: userid
                }
            ],
        },
        take: num,
        orderBy: {
            time: 'desc'
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    return transactions
}

const getActivityForDay = async (userid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: userid
                },
                {
                    receiverid: userid
                }
            ],
            time: {
                gte: new Date(new Date().setDate(new Date().getDate() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    return transactions
}

const getActivityForMonth = async (userid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: userid
                },
                {
                    receiverid: userid
                }
            ],
            time: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    return transactions
}

const getActivityForYear = async (userid: string) => {
    const prisma = new PrismaClient()
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: userid
                },
                {
                    receiverid: userid
                }
            ],
            time: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    return transactions
}

export default {
    getUser,
    getReps,
    getRecentTransactions,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}
