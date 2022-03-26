import express from 'express'
import { globalRouter } from './global'
import { homepageRouter } from './homepage'
import { configRouter } from './config'
import { serverRouter } from './server'
import { userRouter } from './user'

const app = express()

app.use('/global', globalRouter)
app.use('/homepage', homepageRouter)
app.use('/private', configRouter)
app.use('/server', serverRouter)
app.use('/user', userRouter)

export default app