import express from 'express'
import { commandRouter } from './command'

const app = express()

app.use('/command', commandRouter)

export default app
