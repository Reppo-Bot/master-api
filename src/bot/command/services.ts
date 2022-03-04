// import { PrismaClient } from "@prisma/client"
import { InteractionData, DiscordUser } from "./types"

const callCommand = async (serverId?: string, sender?: DiscordUser, commandOptions?: InteractionData) => {
    try {
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