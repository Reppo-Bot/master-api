import { Request, Response, NextFunction } from 'express'
import homeService from './services'
import { success, fail, grabCreds } from '../../util'

const getHourTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactions = await homeService.getHourTransactions()
        success(transactions, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getTotalUserCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalUserCount = await homeService.getTotalUserCount()
        success(totalUserCount, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getTotalServerCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalServerCount = await homeService.getTotalServerCount()
        success(totalServerCount, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const search = async (req: Request, res: Response, next: NextFunction) => {
    const { searchString } = req.body
    try {
        const search = [await homeService.searchServers(searchString), await homeService.searchUsers(searchString)]
        success(search, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    getHourTransactions,
    getTotalUserCount,
    getTotalServerCount,
    search
}
