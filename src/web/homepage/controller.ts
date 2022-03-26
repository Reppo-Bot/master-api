import { Request, Response, NextFunction } from 'express'
import homeService from './services'

const getHourTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transactions = await homeService.getHourTransactions()
        res.send(transactions)
    } catch(e) {

    }
}

const getTotalUserCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalUserCount = await homeService.getTotalUserCount()
        res.send(totalUserCount)
    } catch(e) {

    }
}

const getTotalServerCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalServerCount = await homeService.getTotalServerCount()
        res.send(totalServerCount)
    } catch(e) {

    }
}

const search = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const search = [await homeService.searchServers(), await homeService.searchUsers()]
        res.send(search)
    } catch(e) {

    }
}

export default {
    getHourTransactions,
    getTotalUserCount,
    getTotalServerCount,
    search
}