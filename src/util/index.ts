import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { Command } from '../bot/command/types'
export interface AuthCreds {
    token: string
    ip: string
}

export const _objToMap = (obj: any) => {
    const map = new Map()
    Object.keys(obj).forEach(key => {
        map.set(key, obj[key])
    })
    return map
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
    name: string
    bio: string
    commands: Map<string, Command>
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


export const updateUser = async (discordid: string, name: string, avatar: string, prisma: PrismaClient) => {
  const user = await prisma.user.update({
    where: { discordid: discordid },
    data: { name: name, avatar: avatar }
  })
  if(!user) throw new Error('Failed to update reppo user\'s name and avatar')
  return user
}

