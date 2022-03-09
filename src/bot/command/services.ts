import { PrismaClient, Transaction } from "@prisma/client"
import { Command, Config, InteractionData, Member, Option, Permission, Rank, ReppoRole } from "./types"

const callCommand = async (serverId?: string, sender?: Member, commandOptions?: InteractionData) => {
    try {
        if (!serverId) {
            throw new Error("Server ID is required")
        }

        const client = new PrismaClient()

        // grab the bot and the config

        const bot = await client.bot.findUnique({ where: { serverid: serverId } })
        if (!bot) {
            throw new Error("No bot found")
        }

        const config: Config = bot?.config as unknown as Config

        if(!config) {
            throw new Error("No config found")
        }

        if (serverId != config.serverId) {
            throw new Error("Server IDs do not match")
        }

        // grab the user and create if not in the db

        const callingUser = { 'id': sender?.user?.id, 'username': sender?.user?.username, roles: sender?.roles }

        if (!callingUser.id) {
            throw new Error("No user provided")
        }

        const caller = await client.user.findUnique({ where: { discordid: callingUser.id } }) ?? await client.user.create({ data: { discordid: callingUser.id } })

        // grab the user rep and add if not in the db

        const rep = await client.rep.findUnique({ where: {userid_serverid: { userid: caller.discordid, serverid: serverId }} }) ?? await client.rep.create({
            data: {
                userid: caller.discordid,
                serverid: serverId,
                rep: config.defaultRep,
                userId: caller.id
            }
        })
        const targetUsers = Object.entries(commandOptions?.resolved?.members ?? {}).map(([id, user]) => ({ 'id': id, 'username': user.nick ? user.nick : commandOptions?.resolved?.users?.get(id)?.username, roles: user.roles }))
        console.log(`${callingUser.username} called ${commandOptions?.name} on ${targetUsers.length > 0 ? `${targetUsers.map(u => u.username).join(', ')} on server ${serverId}` : `server ${serverId}`}`)

        // check if the command exists in the config

        const commandName = commandOptions?.name
        if (!commandName) {
            throw new Error("No command name provided")
        }

        const command = config?.commands?.find((command: Command) => command.name === commandName)
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
                    throw new Error(`${command.type} command requires exactly one user`)
                }
                const targetUser = await client.user.findUnique({ where: { discordid: targetUsers[0].id } }) ?? await client.user.create({ data: { discordid: targetUsers[0].id } })

                const targetRep = await client.rep.findUnique({ where: { userid_serverid: { userid: targetUser.discordid, serverid: serverId } } }) ?? await client.rep.create({
                    data: {
                        userid: targetUser.discordid,
                        serverid: serverId,
                        rep: config.defaultRep,
                        userId: caller.id
                    }
                })

                let permission: Permission | undefined
                switch (command.permissionsType) {
                    case 'rank':
                        const rank: Rank | null = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= rep?.rep) ?? null
                        if (!rank) {
                            throw new Error("User does not have a rank")
                        }
                        permission = command.permissions?.find((permission: Permission) => permission.allowed === rank.name)
                        if (!permission) {
                            throw new Error("User does not have permission to run this command")
                        }

                        const targetRank = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= targetRep?.rep)
                        if (!targetRank) {
                            throw new Error("Target user does not have rank")
                        }
                        console.log(rank.name, targetRank.name)
                        if(!permission.allowedOn?.includes(targetRank.name)) {
                            throw new Error("User does not have permission to run this command on this rank")
                        }
                        break
                    case 'role': {
                        const role: ReppoRole | null = config?.roles?.find((role: ReppoRole) => callingUser.roles?.includes(role.roleid)) ?? null
                        if (!role) {
                            throw new Error("User does not have role")
                        }
                        permission = command.permissions?.find((permission: Permission) => permission.allowed === role.name)
                        if (!permission) {
                            throw new Error("User does not have permission to run this command")
                        }
                        const targetRole = config?.roles?.find((role: ReppoRole) => callingUser.roles?.includes(role.roleid))
                        if (!targetRole) {
                            throw new Error("Target user does not have role")
                        }
                        if(targetRole.priority < role.priority) {
                            throw new Error("User does not have permission to run this command on this role")
                        }

                        break
                    }
                    case 'all':
                        if(!command.otherOptions) {
                            throw new Error("Commands without permissions need other options provided")
                        }
                        permission = { allowed: "all", options: command.otherOptions } // make a psudo permission for everyone
                        break
                    default:
                        throw new Error("Invalid permissions type")
                }

                // read the last time the user ran this command
                const action = await client.action.findUnique({ where: { serverid_commandname: { commandname: command.name, serverid: serverId } } }) ?? await client.action.create({
                    data: {
                        commandname: command.name,
                        serverid: serverId,
                    }
                })
                if(!action) {
                    throw new Error("No action found")
                }
                let calls: Transaction[]
                if(permission.options.maxCalls) {
                    calls = await client.transaction.findMany({ where: { senderid: caller.id, actionid: action.id }, take: permission.options.maxCalls ? permission.options.maxCalls : 1000, orderBy: {time: 'desc'}}) ?? []
                } else {
                    calls = await client.transaction.findMany({ where: { senderid: caller.id, actionid: action.id }, take: 1, orderBy: {time: 'desc'}}) ?? []
                }
                if(permission.options.maxCalls && calls.length >= permission.options.maxCalls) {
                    throw new Error("User has reached max calls for the command at this rank")
                }

                if (calls && calls.length > 0) {
                    const lastCall = calls[0]
                    const originalTimeOfCall = new  Date(lastCall.time)
                    const timeOfCall = new  Date(lastCall.time)
                    timeOfCall.setMonth(timeOfCall.getMonth() + (permission.options.cooldown ?? 0))
                    console.log(`${originalTimeOfCall} ${timeOfCall} ${new Date()}`)
                    if( timeOfCall > new Date()) {
                        throw new Error(`You can only use this command every ${permission.options.cooldown} months, last used ${originalTimeOfCall.toDateString()}, next use ${timeOfCall.toDateString()}`)
                    }
                }

                if(command.type === 'adjust') {
                    const updatedTarget = await client.rep.update({
                        where: {
                            userid_serverid: { userid: targetUser.discordid, serverid: config.serverId }
                        },
                        data: {
                            rep: targetRep.rep + (permission?.options.amount ?? 0)
                        }
                    })
                    if(!updatedTarget) {
                        throw new Error("User not found")
                    }

                    const newTransaction = await client.transaction.create({
                        data: {
                            senderid: caller.id,
                            receiverid: targetUser.id,
                            actionid: action.id,
                            serverid: serverId
                        }
                    })
                    if(!newTransaction) {
                        throw new Error("Transaction not created")
                    }
                    return `Successfully gave ${targetUsers[0].username} ${permission?.options.amount ?? 0} rep`
                }

                const amount = commandOptions?.options?.find((option: Option) => option.name === 'amount')

                if (!amount) {
                    throw new Error("No amount provided")
                }

                if(parseInt(amount.value) > (permission.options.maxAmount ?? 0) || parseInt(amount.value) < (permission.options.minAmount ?? 0)) {
                    throw new Error(`Amount is out of range, please make it more than ${permission.options.minAmount} and less than ${permission.options.maxAmount}`)
                }

                break
            }
            case 'info':
                break
            default:
                throw new Error("Command type not supported")
        }
    } catch (e :any) {
        console.log(e.message)
        return e.message
    }
}

export default {
    callCommand
}