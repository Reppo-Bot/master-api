import { Request, Response, NextFunction } from 'express'
import configService from './services'
import { success, fail, grabCreds } from '../../util'

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

const getUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const status = await configService.getUpdateStatus(serverid, grabCreds(req))
        success(status, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const successUpdate = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid, config } = req.body
    try {
        const newBot = await configService.successUpdate(serverid, config)
        success(newBot, res, next)
    } catch(e) {
        fail(e, res)
    }
}

const failUpdate = async (req: Request, res: Response, next: NextFunction) => {
    const { serverid } = req.body
    try {
        const newBot = await configService.failUpdate(serverid)
        success(newBot, res, next)
    } catch(e) {
        fail(e, res)
    }
}

export default {
    updateConfig,
    addServer,
    removeServer,
    getBots,
    getConfig,
    getUpdateStatus,
    successUpdate,
    failUpdate
}
