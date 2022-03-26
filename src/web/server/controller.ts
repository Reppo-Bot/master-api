import { Request, Response, NextFunction } from "express"
import serverService from './services'

const getServer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const server = await serverService.getServer()
        return server
    } catch(e) {

    }
}

const getTopUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const topUsers = await serverService.getTopUsers()
        return topUsers
    } catch(e) {

    }
}

const getActivityForDay = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForDay = await serverService.getActivityForDay()
        return activityForDay
    } catch(e) {

    }
}

const getActivityForMonth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForMonth = await serverService.getActivityForMonth()
        return activityForMonth
    } catch(e) {

    }
}

const getActivityForYear = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activityForYear = await serverService.getActivityForYear()
        return activityForYear
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
