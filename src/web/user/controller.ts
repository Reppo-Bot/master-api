import { Request, Response, NextFunction } from 'express'
import { success, fail } from '../../util' 
import userService from './services'

const getUser = async (req: Request, res: Response, next: NextFunction) => {
    const { discordid } = req.body
    try {
        const user = await userService.getUser(discordid)
        success(user, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getReps = async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.body
    try {
        const reps = await userService.getReps(userid)
        success(reps, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
    const { userid, num } = req.body
    try {
        const recentTransactions = await userService.getRecentTransactions(userid, num)
        success(recentTransactions, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForDay = async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.body
    try {
        const activityForDay = await userService.getActivityForDay(userid)
        success(activityForDay, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForMonth = async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.body
    try {
        const activityForMonth = await userService.getActivityForMonth(userid)
        success(activityForMonth, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForYear = async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.body
    try {
        const activityForYear = await userService.getActivityForYear(userid)
        success(activityForYear, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    getUser,
    getReps,
    getRecentTransactions,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}