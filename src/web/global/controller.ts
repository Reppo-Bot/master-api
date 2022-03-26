import { Request, Response, NextFunction } from "express"
import loginService from './services'

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        loginService.login()
    } catch(e) {
        console.error(e)
        res.send({ 'failed because': e })
        res.status(500) && next(e)
    }
}

export default {
    login
}