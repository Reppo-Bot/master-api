import { Request, Response, NextFunction } from 'express'
import { Interaction } from './types'
import commandService from './services'
import { success, fail } from '../../util'

const callCommand = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction
    try {
        const result = await commandService.callCommand(command)
        success(result, res, next)
        next()
    } catch (e) {
        fail(e, res)
    }
}

export default {
    callCommand
}
