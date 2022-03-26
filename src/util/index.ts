import { Request, Response, NextFunction } from 'express'

export interface AuthCreds {
    token: string
    ip: string
}

export interface DiscordUser {
    id: string
    username: string
    discriminator: string
    avatar: string
    bot?: boolean
    system?: boolean
    mfa_enabled?: boolean
    banner?: string
    accent_color?: number
    locale?: string
    verified?: boolean
    email?: string
    flags?: number
    premium_type?: number
    public_flags?: number
}

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

export const grabCreds = (req: Request): AuthCreds => {
    return { ip: (req.headers['x-forwarded-for'] || req.ip) as string, token: req.headers.authorization ?? '' }
}