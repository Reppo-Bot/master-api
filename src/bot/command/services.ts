import { PrismaClient, Rep, Transaction } from "@prisma/client"
import { Command, Config, InfoBlock, InteractionData, Member, Option, Permission, Rank, ReppoRole } from "./types"

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

        console.log('here')
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

        // check if the user is banned from reppo

        // start by checking if they are able to be unbanned
        if(rep.unlocktime && rep.unlocktime.getDate() < new Date().getDate()) {
            await client.rep.update({
                where: { userid_serverid: {userid: rep.userId, serverid: rep.serverid } },
                data: {
                    unlocktime: null,
                    locked: false
                }
            })
        }
        if (rep.locked) {
            throw new Error(`You are locked from using reppo funcitons, please try again on ${rep.unlocktime?.toLocaleDateString()}`)
        }

        // handle command args and perms
        let permission: Permission | undefined
        switch (command.type) {
            case 'set': case 'adjust': case 'ban':
                if (!targetUsers || targetUsers.length !== 1) {
                    throw new Error(`${command.type} command requires exactly one user`)
                }
                break
            case 'info':
                break
            default:
                throw new Error("Command type not found")
        }

        const targetUser = targetUsers && targetUsers.length > 0 ? await client.user.findUnique({ where: { discordid: targetUsers[0].id } }) ?? await client.user.create({ data: { discordid: targetUsers[0].id } }) : null

        const targetRep = targetUsers && targetUser ? await client.rep.findUnique({ where: { userid_serverid: { userid: targetUser.discordid, serverid: serverId } } }) ?? await client.rep.create({
            data: {
                userid: targetUser?.discordid,
                serverid: serverId,
                rep: config.defaultRep,
                userId: caller.id
            }
        }) : null

        const action = await client.action.findUnique({ where: { serverid_commandname: { commandname: command.name, serverid: serverId } } }) ?? await client.action.create({
            data: {
                commandname: command.name,
                serverid: serverId,
            }
        })
        if(!action) {
            throw new Error("No action found")
        }

        switch(command.permissionsType) {
            case 'rank':
                const rank: Rank | null = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= rep?.rep) ?? null
                if (!rank) {
                    throw new Error("User does not have a rank")
                }
                permission = command.permissions?.find((permission: Permission) => permission.allowed === rank.name)
                if (!permission) {
                    throw new Error("User does not have permission to run this command")
                }
                
                if(command.type === 'info' && (!targetUsers || targetUsers.length !== 1)) break

                const targetRank = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= (targetRep?.rep ?? -1))
                if (!targetRank) {
                    throw new Error("Target user does not have rank")
                }
                if(!permission.allowedOn?.includes(targetRank.name)) {
                    throw new Error("User does not have permission to run this command on this rank")
                }
                break
            case 'role':
                const role: ReppoRole | null = config?.roles?.find((role: ReppoRole) => callingUser.roles?.includes(role.roleid)) ?? null
                if (!role) {
                    throw new Error("User does not have role")
                }
                permission = command.permissions?.find((permission: Permission) => permission.allowed === role.name)
                if (!permission) {
                    throw new Error("User does not have permission to run this command")
                }

                if(command.type === 'info' && (!targetUsers || targetUsers.length !== 1)) break

                const targetRole = config?.roles?.find((role: ReppoRole) => callingUser.roles?.includes(role.roleid))
                if (!targetRole) {
                    throw new Error("Target user does not have role")
                }
                if(targetRole.priority < role.priority) {
                    throw new Error("User does not have permission to run this command on this role")
                }
                break
                case 'all':
                    if(!command.otherOptions) {
                        throw new Error("Commands without permissions need other options provided")
                    }
                    permission = { allowed: "all", options: command.otherOptions } // make a psudo permission for everyone
                    break
                default:
                    throw new Error("Invalid permissions type")
        }

        let calls: Transaction[]
        console.log('here 3')
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
            if( timeOfCall > new Date()) {
                throw new Error(`You can only use this command every ${permission.options.cooldown} months, last used ${originalTimeOfCall.toDateString()}, next use ${timeOfCall.toDateString()}`)
            }
        }
        
        switch (command.type) {
            case 'adjust': {
                if(!targetUser || !targetRep) {
                    throw new Error("No target user found")
                }
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

                console.log('here 4')
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

            case 'set': case 'ban': {
                if(!targetUser || !targetRep)
                    throw new Error("No target user found")

                let amount : Option | undefined
                if(command.type === 'ban') {
                    amount = permission.options.amount != null ? { name: 'amount', value: permission.options.amount.toString() } : commandOptions?.options?.find((option: Option) => option.name === 'amount')
                } else if (command.type === 'set') 
                    amount = commandOptions?.options?.find((option: Option) => option.name === 'amount')

                if (!amount) {
                    throw new Error("No amount provided")
                }

                let returnMessage = ""

                if(command.type === 'set') {
                    if(parseInt(amount.value) > (permission.options.maxAmount ?? 0) || parseInt(amount.value) < (permission.options.minAmount ?? 0)) {
                        throw new Error(`Amount is out of range, please make it more than ${permission.options.minAmount} and less than ${permission.options.maxAmount}`)
                    }
                    const updatedTarget = await client.rep.update({
                        where: {
                            userid_serverid: { userid : targetUser.discordid, serverid: config.serverId }
                        },
                        data: {
                            rep: parseInt(amount.value)
                        }
                    })
                    if(!updatedTarget) {
                        throw new Error("User not found")
                    }
                    returnMessage = `Successfully set ${targetUsers[0].username}'s rep to ${amount.value}`
                }

                if(command.type === 'ban') {
                    if(!targetUser || !targetRep)
                        throw new Error("No target user found")

                    if(parseInt(amount.value) < 0) {
                        // unban the person
                        const unbanned = await client.rep.update({
                            where: { userid_serverid: {userid: targetRep.userid, serverid: targetRep.serverid } },
                            data: {
                                unlocktime: null,
                                locked: false
                            }
                        })
                        if(!unbanned) {
                            throw new Error("User not found")
                        }
                        returnMessage = `Successfully unbanned ${targetUsers[0].username}`
                    } else if(parseInt(amount.value) == 0) {
                        // ban forever
                        const banned = await client.rep.update({
                            where: { userid_serverid: {userid: targetRep.userid, serverid: targetRep.serverid } },
                            data: {
                                locked: true,
                                unlocktime: null
                            }
                        })
                        if(!banned) {
                            throw new Error("User not found")
                        }
                        returnMessage = `Successfully banned ${targetUsers[0].username}`
                    } else {
                        // kick for x months
                        const unlockTime = new Date()
                        unlockTime.setMonth(unlockTime.getMonth() + parseInt(amount.value))
                        const kicked = await client.rep.update({
                            where: { userid_serverid: {userid: targetRep.userid, serverid: targetRep.serverid } },
                            data: {
                                locked: true,
                                unlocktime: unlockTime
                            }
                        })
                        if(!kicked) {
                            throw new Error("User not found")
                        }
                        returnMessage = `Successfully kicked ${targetUsers[0].username} for ${amount.value} months`
                    }
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
                return returnMessage
            }
            case 'info':
                const infoDump: InfoBlock = {}
                if(!targetUsers || targetUsers.length == 0) {
                    console.log('here 4')
                    for(const item in permission?.options.info) {
                        switch(permission.options.info[item]) {
                            case 'name':
                                infoDump.name = callingUser.username
                                break
                            case 'rep':
                                infoDump.rep = rep.rep
                                break
                            case 'rank':
                                infoDump.rank = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= rep.rep)?.name
                                break
                            case 'pos':
                                infoDump.pos = await (await client.rep.findMany({ where: { serverid: serverId }, orderBy: { rep: 'desc' } })).indexOf(rep) + 1
                        }
                    }
                } else {
                    if(!targetUser || !targetRep)
                        throw new Error("No target user found")

                    for(const item in permission.options.info) {
                        switch(permission.options.info[item]) {
                            case 'name':
                                infoDump.name = targetUsers[0].username
                                break
                            case 'rep':
                                infoDump.rep = targetRep?.rep
                                break
                            case 'rank':
                                infoDump.rank = config?.ranks?.sort((a, b) => b.minRep - a.minRep).find((rank: Rank) => rank.minRep <= targetRep?.rep)?.name
                                break
                            case 'pos':
                                const reps = await client.rep.findMany({ where: { serverid: targetRep.serverid }, orderBy: { rep: 'desc' } })
                                infoDump.pos = reps.findIndex((rep: Rep) => rep.userid === targetRep.userid) + 1
                                break
                        }
                    }
                }
                const newTransaction = await client.transaction.create({
                    data: {
                        senderid: caller.id,
                        receiverid: targetUser?.id ? targetUser.id : null,
                        actionid: action.id,
                        serverid: serverId
                    }
                })

                if(!newTransaction) {
                    throw new Error("Transaction not created")
                }
                console.log(infoDump)
                return `${infoDump.name ? `Name: ${infoDump.name}` : ''} ${infoDump.rep ? `Rep: ${infoDump.rep}` : ''} ${infoDump.rank ? `Rank: ${infoDump.rank}` : ''} ${infoDump.pos ? `Position: ${infoDump.pos}` : ''}`
            default:
                throw new Error("Command type not supported")
        }
    } catch (e) {
        if (e instanceof Error) {
            console.log(e.message)
            return e.message
        } else {
            return e
        }
    }
}

const reply = async (interactionId: string, message: string, token: string) => {
    const BASE_URL = 'https://discord.com/api/v9'
    const reply_url = `${BASE_URL}/interactions/${interactionId}/${token}/callback`
    const json = JSON.stringify({
        type: 4,
        data: {
            content: message
        }
    })
    fetch(reply_url, {
        method: 'POST',
        body: json,
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => console.log(data))
    // .catch(err)
    return true
}

export default {
    callCommand,
    reply
}