import axios, { AxiosResponse } from "axios"

interface Handler {
    post (url: string, data: unkown, headers: unkown): AxiosResponse
    get (url: string, headers: unkown): AxiosResponse
    delete (url: string, headers: unkown): AxiosResponse
}

export const discordCommandsCall = async (handler: Handler,type: string, url: string, data?: any) => {
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

    console.log(res.headers)

    if(res.headers['x-ratelimit-remaining'] && res.headers['x-ratelimit-remaining'] == '0') {
        console.log('Rate limit reached, waiting')
        await new Promise(resolve => setTimeout(resolve, parseFloat(res.headers['x-ratelimit-reset-after']) ?? 0 ))
    }

    return res
}
