import { Request, Response, NextFunction } from 'express'
import configService from './services'
import { AuthCreds } from './types'
import { success, fail } from '../../util'

const grabCreds = (req: Request): AuthCreds => {
    return { ip: (req.headers['x-forwarded-for'] || req.ip) as string, token: req.headers.authorization ?? '' }
}

const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid, config } = req.body
    try {
        const newConfig = await configService.updateConfig(serverid, config, grabCreds(req))
        success(newConfig, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const addServer = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid, serveravatar } = req.body
    try {
        const newServer = await configService.addServer(serverid, serveravatar, grabCreds(req))
        success(newServer, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const removeServer = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const removedServer = await configService.removeServer(serverid, grabCreds(req))
        success(removedServer, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getBots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bots = await configService.getBots(grabCreds(req))
        success(bots, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const getConfig = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const config = await configService.getConfig(serverid, grabCreds(req))
        success(config, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    updateConfig,
    addServer,
    removeServer,
    getBots,
    getConfig
}
