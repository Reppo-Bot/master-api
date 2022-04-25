import { Router } from 'express'
import globalController from './controller'

const router = Router()

router.post('/login', globalController.login)
router.post('/logout', globalController.logout)

export default router