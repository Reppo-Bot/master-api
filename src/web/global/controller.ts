import { Request, Response, NextFunction } from "express"
import loginService from './services'
import { success, fail, grabCreds } from "../../util"

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { timestamp } = req.body
    try {
        const session = await loginService.login(grabCreds(req), timestamp)
        success(session, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    login
}