import { Request, Response, NextFunction } from 'express'
import { Interaction } from './types'
import commandService from './services'
import { success, fail } from '../../util'

const callCommand = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction
    try {
        const result = await commandService.callCommand(command)
	    await commandService.reply(command.id, result, command.token)
        success(result, res, next)
        next()
    } catch (e) {
        fail(e, res)
    }
}

const callVibecheck = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction
    try {
        const result = await commandService.callVibecheck(command)
        await commandService.reply(command.id, result, command.token)
        success(result, res, next)
        next()
    } catch (e) {
        fail(e, res)
    }
}

const callLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction
    try {
        const result = await commandService.callLeaderboard(command)
        await commandService.reply(command.id, result, command.token)
        success(result, res, next)
        next()
    } catch (e) {
        fail(e, res)
    }
}



export default {
    callCommand,
    callVibecheck,
    callLeaderboard
}
