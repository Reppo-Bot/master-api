import { Router } from 'express'
import configController from './controller'

const router = Router()

router.post('/updateConfig', configController.updateConfig)
router.post('/addServer', configController.addServer)
router.post('/removeServer', configController.removeServer)
router.post('/getBots', configController.getBots)
router.post('/getConfig', configController.getConfig)

export default router
