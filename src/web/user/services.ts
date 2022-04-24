import { PrismaClient } from '@prisma/client'

const getUser = async (userid: string) => {
    const prisma = new PrismaClient()
    // get the user from the db
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    await prisma.$disconnect()
    return user
}

const getReps = async (userid: string) => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    const reps = await prisma.rep.findMany({ where: {userid: user.id}})
    if(reps == null) throw new Error('Failed to grab reps')
    await prisma.$disconnect()
    return reps
}

const getRecentTransactions = async (userid: string, num: number) => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    if(num <= 0) throw new Error("Please specify a number greater than 0")
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: user.id
                },
                {
                    receiverid: user.id
                }
            ],
        },
        include: {
            action: {
                select: {
                    commandname: true
                }
            },
            Bot: {
                select: {
                    servername: true
                }
            }
        },
        take: num,
        orderBy: {
            time: 'desc'
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

const getActivityForDay = async (userid: string) => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: user.id
                },
                {
                    receiverid: user.id
                }
            ],
            time: {
                gte: new Date(new Date().setDate(new Date().getDate() - 1))
            }
        },
        include: {
            action: {
                select: {
                    commandname: true
                }
            },
            Bot: {
                select: {
                    servername: true
                }
            }
        }
    })
    const actionIds = transactions.map((transaction)=> transaction.actionid)
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

const getActivityForMonth = async (userid: string) => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: user.id
                },
                {
                    receiverid: user.id
                }
            ],
            time: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
        },
        include: {
            action: {
                select: {
                    commandname: true
                }
            },
            Bot: {
                select: {
                    servername: true
                }
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
    return transactions
}

const getActivityForYear = async (userid: string) => {
    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({ where: { discordid: userid }})
    if(!user) throw new Error('Failed to find specified user')
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                {
                    senderid: user.id
                },
                {
                    receiverid: user.id
                }
            ],
            time: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
        },
        include: {
            action: {
                select: {
                    commandname: true
                }
            },
            Bot: {
                select: {
                    servername: true
                }
            }
        }
    })
    if(transactions == null) throw new Error('failed to grab transactions')
    await prisma.$disconnect()
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
