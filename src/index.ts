import vhost from 'vhost'
import express from 'express'
import { config } from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import fileUpload from 'express-fileupload'

import getConfig from '../config/config'
import botApp from './bot'
import app from './bot'

const environment = getConfig()
config()
const testApp = express()

testApp.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

express()
.use(cors())
.use(function (req, res, next) {
    req.setTimeout(2000, () => {
        res.status(408).send('Request Timeout')
    })
    next()
})
app.use(
    fileUpload({
        limits: {
            fileSize: 100 * 1024,
        },
        abortOnLimit: true
    })
)
.use(helmet())
.use(bodyParser.json())
.use(vhost(`test.${environment.APP_HOST}`, testApp))
.use(vhost(`bot.${environment.APP_HOST}`, botApp))
.listen(environment.APP_PORT)
