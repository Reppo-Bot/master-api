import { Router } from 'express'

import commandController from './controllers'

const router = Router()

router.post('/callCommand', commandController.callCommand)
router.post('/callVibecheck', commandController.callVibecheck)
router.post('/callLeaderboard', commandController.callLeaderboard)

export default router
