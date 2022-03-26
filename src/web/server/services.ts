import { PrismaClient } from '@prisma/client'

const getServer = async (serverid: string) => {
    const prisma = new PrismaClient()
    try {
        // we need to get these details for the server:
    } catch(e) {

    }
}

const getTopUsers = async () => {
    try {
        console.log('hello reps')
    } catch(e) {

    }
}

const getActivityForDay = async () => {
    try {
        console.log('hello activity for day')
    } catch(e) {

    }
}

const getActivityForMonth = async () => {
    try {
        console.log('hello activity for month')
    } catch(e) {

    }
}

const getActivityForYear = async () => {
    try {
        console.log('hello activity for year')
    } catch(e) {

    }
}

export default {
    getServer,
    getTopUsers,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}