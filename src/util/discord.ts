import axios, { AxiosResponse } from "axios"

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
            res = await axios.post(url, data, { headers })
            break
        case 'get':
            res = await axios.get(url, { headers })
            break
        case 'delete':
            res = await axios.delete(url, { headers })
            break
    }
    if(!res) throw new Error('No response from discord')

    await limit(res)

    return res
}

export const limit = async (res: AxiosResponse) => {
    if(res.headers['x-ratelimit-remaining'] && res.headers['x-ratelimit-remaining'] == '0') {
        console.log('Rate limit reached, waiting')
        console.log(`waiting ${res.headers['x-ratelimit-reset-after']} seconds`)
        await new Promise(resolve => setTimeout(resolve, (parseInt(res.headers['x-ratelimit-reset-after']) ?? 0) * 1000))
    }
}
