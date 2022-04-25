import { Request, Response, NextFunction } from "express"
import { success, fail } from "../../util"
import serverService from './services'

const getServer = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const server = await serverService.getServer(serverid)
        success(server, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getTopUsers = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid, num } = req.body
    try {
        const topUsers = await serverService.getTopUsers(serverid, num)
        success(topUsers, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForDay = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const activityForDay = await serverService.getActivityForDay(serverid)
        success(activityForDay, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForMonth = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const activityForMonth = await serverService.getActivityForMonth(serverid)
        success(activityForMonth, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getActivityForYear = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const activityForYear = await serverService.getActivityForYear(serverid)
        success(activityForYear, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    getServer,
    getTopUsers,
    getActivityForDay,
    getActivityForMonth,
    getActivityForYear
}
