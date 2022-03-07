import { PrismaClient } from "@prisma/client"
import { InteractionData, DiscordUser } from "./types"

const callCommand = async (serverId?: string, sender?: DiscordUser, commandOptions?: InteractionData) => {
    
    // pull the config from the db
    // set up the servers ranks, roles, and commands for usage when calling
    // how do we want to do this initially???????
    // that way we dont have to keep repeating the calls?
    // should we cache it? no because that will keep state and we dont want to do that
    // so there should be a way to manually do it quickly
    // maybe if we just pull everything?????? then we can extrapolate as needed?
    // maybe we only need to build as needed so go: command name -> command lookup -> command perms -> result of the command?
    
    try {
        const client = new PrismaClient()
        // pull the bot from the db
        const bot = await client.bot.findUnique({ where: { id: serverId } }).then(bot => bot)
        if (!bot) {
            throw new Error("No bot found")
        }

        // grab the command name
        const commandName = commandOptions?.name

        if (!commandName) {
            throw new Error("No command name provided")
        }

        // check to see if the command exists in the servers config
        const config = JSON.parse(bot.config?.toString() ?? '')
        
        const targetUsers = Object.entries(commandOptions?.resolved?.users ?? {}).map(([, user]) => ({ 'id': user.id, 'username': user.username}))
        const callingUser = { 'id': sender?.id, 'username': sender?.username }
        return `${callingUser.username} called ${commandOptions?.name} on ${targetUsers.length > 0 ? `${targetUsers.map(u => u.username).join(', ')} on server ${serverId}` : `server ${serverId}`}`
    } catch(e) {
        console.error(e)
    }
}

export default {
    callCommand
}