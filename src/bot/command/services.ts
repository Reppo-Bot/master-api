import { PrismaClient } from "@prisma/client"
import { InteractionData, Member } from "./types"

const callCommand = async (serverId?: string, sender?: Member, commandOptions?: InteractionData) => {
    try {
        if (!serverId) {
            throw new Error("Server ID is required")
        }

        const client = new PrismaClient()

        // grab the bot and the config

        const bot = await client.bot.findUnique({ where: { id: serverId } }).then(bot => bot)
        if (!bot) {
            throw new Error("No bot found")
        }

        const config = JSON.parse(bot.config?.toString() ?? '')

        if (serverId != config.serverId) {
            throw new Error("Server IDs do not match")
        }

        // grab the user and create if not in the db

        const callingUser = { 'id': sender?.user?.id, 'username': sender?.user?.username, roles: sender?.roles }

        if (!callingUser.id) {
            throw new Error("No user provided")
        }

        const caller = await client.user.findUnique({ where: { id: callingUser.id } }) ?? await client.user.create({ data: { discordid: callingUser.id } })

        // grab the user rep and add if not in the db

        const rep = await client.rep.findUnique({ where: { userid_serverid: { userid: caller.id, serverid: serverId } } }) ?? await client.rep.create({
            data: {
                userid: caller.discordid,
                serverid: serverId,
                rep: config.defaultRep,
                userId: caller.id
            }
        })

        const targetUsers = Object.entries(commandOptions?.resolved?.members ?? {}).map(([, user]) => ({ 'id': user.id, 'username': user.username, roles: user.roles }))
        console.log(`${callingUser.username} called ${commandOptions?.name} on ${targetUsers.length > 0 ? `${targetUsers.map(u => u.username).join(', ')} on server ${serverId}` : `server ${serverId}`}`)

        // check if the command exists in the config

        const commandName = commandOptions?.name
        if (!commandName) {
            throw new Error("No command name provided")
        }

        const command = config.commands.find((command: any) => command.name === commandName)
        if (!command) {
            throw new Error("No command found")
        }

        // handle command args and perms
        if (rep.locked) {
            throw new Error("You are locked from using reppo funcitons")
        }
        switch (command.type) {
            case 'set': case 'adjust': case 'ban': {
                if (!targetUsers || targetUsers.length !== 1) {
                    throw new Error("Set command requires exactly one user")
                }
                const targetUser = await client.user.findUnique({ where: { id: targetUsers[0].id } }) ?? await client.user.create({ data: { discordid: targetUsers[0].id } })

                const targetRep = await client.rep.findUnique({ where: { userid_serverid: { userid: targetUser.discordid, serverid: serverId } } }) ?? await client.rep.create({
                    data: {
                        userid: targetUser.discordid,
                        serverid: serverId,
                        rep: config.defaultRep,
                        userId: caller.id
                    }
                })

                switch (command.permissionsType) {
                    case 'rank':
                        const rank = config.ranks.find((rank: any) => rank.minRep <= rep?.rep)
                        if (!rank || rank.length === 0) {
                            throw new Error("User does not have rank")
                        }
                        const permission = command.permissions.find((permission: any) => permission.allowedRole === rank.name)
                        if (!permission || permission.length === 0) {
                            throw new Error("User does not have permission to run this command")
                        }
                        // read the last time the user ran this command
                        const action = await client.action.findMany({ where: { commandname: command.name, serverid: serverId} }) ?? []
                        if(action.length !== 1) {
                            throw new Error("No action found")
                        }
                        const lastCall = await client.transaction.findFirst({ where: { senderid: caller.id, actionid: action[0].id } })

                        if (lastCall) {
                            const originalTimeOfCall = new  Date(lastCall.time)
                            const timeOfCall = new  Date(lastCall.time)
                            timeOfCall.setHours(timeOfCall.getMonth() + command.cooldown)
                            if( timeOfCall > new Date()) {
                                throw new Error(`You can only use this command every ${command.cooldown} months, last used ${originalTimeOfCall.toDateString()}`)
                            }
                        }

                        const targetRank = config.ranks.find((rank: any) => rank.minRep <= targetRep?.rep)
                        if (!targetRank || targetRank.length === 0) {
                            throw new Error("Target user does not have rank")
                        }
                        if(!permission.allowedOn.includes(targetRank.name)) {
                            throw new Error("User does not have permission to run this command on this rank")
                        }
                        break
                    case 'role':
                        break
                    default:
                        throw new Error("Invalid permissions type")
                }

                if (command.type === 'adjust') break

                const amount = commandOptions?.options?.find((option: any) => option.name === 'amount')

                if (!amount) {
                    throw new Error("No amount provided")
                }

                if(amount < command.maxAmount || amount > command.minAmount) {
                    throw new Error(`Amount is out of range, please make it more than ${command.minAmount} and less than ${command.maxAmount}`)
                }

                break
            }
            case 'info':
                break
            default:
                throw new Error("Command type not supported")
        }

        switch (command.permissionsType) {
            case 'role':
                const role = config.roles.find((role: any) => callingUser?.roles?.includes(role.roleid))
                if (!role || role.length === 0) {
                    throw new Error("You do not have permission to use this command")
                }
                break
            case 'rank':
                const rank = config.ranks.find((rank: any) => rank.minRep <= rep?.rep)
                if (!rank || rank.length === 0) {
                    throw new Error("User does not have permission to run this command")
                }
                break
            default:
                throw new Error("No permissions type specified")
        }
    } catch (e) {
        console.error(e)
    }
}


export default {
    callCommand
}