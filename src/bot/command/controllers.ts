import { Request, Response, NextFunction } from 'express'
import { Interaction } from './types'
import commandService from './services'

const callCommand = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction
    let responseMessage: string
    try {
        responseMessage = await commandService.callCommand(command)
    } catch (e) {
        const { message }: Error = (e as Error)
        responseMessage = message
    }
    console.log(responseMessage)
    if (!commandService.reply(command.id, responseMessage, command.token)) {
        res.status(200)
        res.send({ 'failed': responseMessage })
    } else {
        res.status(500)
        res.send({ 'success': responseMessage })
    }
    next()
}

export default {
    callCommand
}
