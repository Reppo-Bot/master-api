import { Router } from 'express'
import configController from './controller'

const router = Router()

router.post('/updateConfig', configController.updateConfig)
router.post('/addServer', configController.addServer)
router.post('/removeServer', configController.removeServer)
router.post('/getBots', configController.getBots)
router.post('/getConfig', configController.getConfig)
router.post('/getUpdateStatus', configController.getUpdateStatus)
router.post('/successUpdate', configController.successUpdate)
router.post('/failUpdate', configController.failUpdate)

export default router
