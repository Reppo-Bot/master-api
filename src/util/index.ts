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

export interface ConfigLite {
    serverId: string
    defaultRep: number
    name: string
    bio: string
    commands: CommandLite[]
}

export interface CommandLite {
    name: string
    description: string
    type: string
}

export const BASE_URL = 'https://discord.com/api/v9'

export const success = (toReturn: any, res: Response, next: NextFunction) => {
    console.log(toReturn)
    res.status(200)
    res.send({ 'success': toReturn })
    next()
}

export const fail = (toReturn: any, res: Response) => {
    const { message }: Error = toReturn as Error
    console.error(message)
    res.status(500)
    res.send({ 'failed': message })
}

export const grabCreds = (req: Request): AuthCreds => {
    return { ip: (req.headers['x-forwarded-for'] || req.ip) as string, token: req.headers.authorization?.split(' ')[1] ?? '' }
}
