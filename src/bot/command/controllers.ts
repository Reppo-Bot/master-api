import { Request, Response, NextFunction } from 'express'
import { Interaction } from './types'
import commandService from './services'

const callCommand = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction

    try {
        const result = await commandService.callCommand(command)
        console.log(result)
        res.status(200)
        if (!commandService.reply(command.id, result as string, command.token)) {
            res.send({ 'failed': result })
        } else {
            res.send({ 'success': result })
        }
        next()
    } catch (e) {
        console.error(e)
        res.send({ 'failed': (e as Error).message })
        res.status(500) && next(e)
    }
}

export default {
    callCommand
}
