import { Router } from 'express'

import commandController from './controllers'

const router = Router()

router.post('/callCommand', commandController.callCommand)

export default router
