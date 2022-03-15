import { Request, Response, NextFunction } from 'express'
import { Interaction } from './types'
import commandService from './services'

const callCommand = async (req: Request, res: Response, next: NextFunction) => {
    const command = req.body as Interaction

    try {
        const result = await commandService.callCommand(command.guild_id, command.member, command.data)
        res.status(200)
        commandService.reply(command.id, result as string, command.token)
        res.send({'message': 'successfully responded'})
        next()
    } catch(e) {
        console.error(e)
        // res.send({'error': e})
        res.status(500) && next(e)
    }
}

export default { 
    callCommand
}