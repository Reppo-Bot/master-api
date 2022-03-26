import { Request, Response, NextFunction } from "express"
import loginService from './services'
import { success, fail, grabCreds } from "../../util"

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = loginService.login(grabCreds(req))
        success(session, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    login
}