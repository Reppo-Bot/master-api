import { Router } from "express"
import homepageController from './controller'

const router = Router()

router.post('/search', homepageController.search)
router.post('/getHourTransactions', homepageController.getHourTransactions)
router.post('/getTotalUserCount', homepageController.getTotalUserCount)
router.post('/getTotalServerCount', homepageController.getTotalServerCount)

export default router