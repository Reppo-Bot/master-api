import { Request, Response, NextFunction } from 'express'
import configService from './services'

const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newConfig = await configService.updateConfig()
        return newConfig
    } catch(e) {

    }
}

const addServer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newServer = await configService.addServer()
        return newServer
    } catch(e) {

    }
}

const removeServer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const removedServer = await configService.removeServer()
        return removedServer
    } catch(e) {

    }
}

const getBots = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bots = await configService.getBots()
        return bots
    } catch(e) {

    }
}

const getConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configService.getConfig()
        return config
    } catch(e) {

    }
}

export default {
    updateConfig,
    addServer,
    removeServer,
    getBots,
    getConfig
}
