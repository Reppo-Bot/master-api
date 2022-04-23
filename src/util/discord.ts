import axios, { AxiosResponse } from "axios"

export const discordCommandsCall = async (type: string, url: string, data?: any) => {
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

    console.log(res.headers)

    if(res.headers['x-ratelimit-remaining'] && res.headers['x-ratelimit-remaining'] == '0') {
        console.log('Rate limit reached, waiting')
        await new Promise(resolve => setTimeout(resolve, parseFloat(res.headers['x-ratelimit-reset-after']) * 1000))
    }

    return res
}
