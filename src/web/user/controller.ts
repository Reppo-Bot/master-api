import { Request, Response, NextFunction } from 'express'
import userService from './services'

const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUser()
        return user
    } catch(e) {

    }
}

const getReps = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reps = await userService.getReps()
        return reps
    } catch(e) {

    }
}

const getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const recentTransactions = await userService.getRecentTransactions()
        return recentTransactions
    } catch(e) {

    }
}

const getActivityForDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForDay = await userService.getActivityForDay()
        return activityForDay
    } catch(e) {

    }
}

const getActivityForMonth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForMonth = await userService.getActivityForMonth()
        return activityForMonth
    } catch(e) {

    }
}

const getActivityForYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForYear = await userService.getActivityForYear()
        return activityForYear
    } catch(e) {

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