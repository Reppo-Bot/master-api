import axios, { AxiosResponse } from "axios"
import { TypeInfo } from "graphql"

export interface Handler {
    post (url: string, data: unknown, headers: unknown): AxiosResponse
    get (url: string, headers: unknown): AxiosResponse
    delete (url: string, headers: unknown): AxiosResponse
}

export const discordCommandsCall = async (handler: Handler | typeof axios,type: string, url: string, data?: any) => {
    const headers = {
        'Authorization': `Bot ${process.env.TOKEN}`
    }
    let res: AxiosResponse = {} as AxiosResponse

    switch(type) {
        case 'post':
            res = await handler.post(url, data, { headers })
            break
        case 'get':
            res = await handler.get(url, { headers })
            break
        case 'delete':
            res = await handler.delete(url, { headers })
            break
    }
    if(!res) throw new Error('No response from discord')

    if(res.headers['x-ratelimit-remaining'] && res.headers['x-ratelimit-remaining'] == '0') {
        console.log('Rate limit reached, waiting')
        console.log(`waiting ${res.headers['x-ratelimit-reset-after']} seconds`)
        await new Promise(resolve => setTimeout(resolve, (parseInt(res.headers['x-ratelimit-reset-after']) ?? 0) * 1000))
    }

    return res
}