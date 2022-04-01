import { Router } from 'express'
import globalController from './controller'

const router = Router()

router.post('/login', globalController.login)

export default router