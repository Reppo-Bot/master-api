import { Response, NextFunction } from 'express'

export const success = (toReturn: any, res: Response, next: NextFunction) => {
    console.log(toReturn)
    res.status(200)
    res.send({ 'success': toReturn })
    next()
}

export const fail = (toReturn: any, res: Response) => {
    console.error(toReturn)
    res.status(500)
    res.send({ 'failed': toReturn })
}