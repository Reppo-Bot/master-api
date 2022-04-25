import { Request, Response, NextFunction } from "express"
import loginService from './services'
import { success, fail, grabCreds, AuthCreds } from "../../util"

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { timestamp } = req.body
    try {
        const session = await loginService.login(grabCreds(req), timestamp)
        success(session, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token }: AuthCreds = grabCreds(req)
        const session = await loginService.logout(token)
        success(session, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    login,
    logout
}