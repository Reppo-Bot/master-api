import vhost from 'vhost'
import express from 'express'

import { config } from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'

config()
const testApp = express()

testApp.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>')
})

express()
.use(cors())
.use(helmet())
.use(vhost('test.localhost', testApp))
.listen(8080)