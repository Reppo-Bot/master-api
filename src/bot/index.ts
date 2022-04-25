import express from 'express'
import { commandRouter } from './command'

const app = express()

app.use('/', commandRouter)

export default app
