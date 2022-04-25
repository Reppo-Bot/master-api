import vhost from 'vhost'
import express from 'express'
import { config } from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import compression from 'compression'
import SegfaultHandler from 'segfault-handler'

import getConfig from '../config/config'
import botApp from './bot'
import webApp from './web'

const environment = getConfig()
config()
const testApp = express()

SegfaultHandler.registerHandler('crash.log');

testApp.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

express()
.options('*', cors() as any)
.use(cors())
.use(function (req, res, next) {
    req.setTimeout(2000, () => {
        res.status(408).send('Request Timeout')
    })
    next()
})
.use(compression())
.use(helmet())
.use(bodyParser.json())
.use('/bot', botApp)
.use('/test', testApp)
.use('/web', webApp)
.use(vhost(`bot.${environment.APP_HOST}`, botApp))
.use(vhost(`test.${environment.APP_HOST}`, testApp))
.use(vhost(`web.${environment.APP_HOST}`, webApp))
.listen(environment.APP_PORT, () => console.log(`Listening on ${environment.APP_HOST}:${environment.APP_PORT}`))
