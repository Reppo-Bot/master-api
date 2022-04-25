import { Router } from 'express'
import userController from './controller'

const router = Router()

router.post('/getUser', userController.getUser)
router.post('/getReps', userController.getReps)
router.post('/getRecentTransactions', userController.getRecentTransactions)
router.post('/getActivityForDay', userController.getActivityForDay)
router.post('/getActivityForMonth', userController.getActivityForMonth)
router.post('/getActivityForYear', userController.getActivityForYear)

export default router
