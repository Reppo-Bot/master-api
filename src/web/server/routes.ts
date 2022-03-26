import { Router } from 'express'
import serverController from './controller'

const router = Router()

router.post('/getServer', serverController.getServer)
router.post('/getTopUsers', serverController.getTopUsers)
router.post('/getActivityForDay', serverController.getActivityForDay)
router.post('/getActivityForMonth', serverController.getActivityForMonth)
router.post('/getActivityForYear', serverController.getActivityForYear)

export default router