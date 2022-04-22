import { Action, PrismaClient, Rep, User } from "@prisma/client";
import axios from "axios";
import { Interaction, Config, Command, Permission, Member, InfoBlock, Option, InteractionData, Rank } from "./types";
import { BASE_URL, updateUser } from "../../util";

const callCommand = async (command: Interaction) => {
  const prisma = new PrismaClient()
  try {
    if (!command) throw new Error('No command data provided')

    const { guild_id, member, data }: Interaction = command
    if (!guild_id) throw new Error('No serverId provided')
    if (!member) throw new Error('No caller provided')
    if (!member.user) throw new Error('No caller user provided')
    if (!data) throw new Error('No data provided')

    const bot = await prisma.bot.findUnique({where: { serverid: guild_id }})
    if (!bot) throw new Error('No bot found')
    if (!bot.config) throw new Error('No config found')
    const { serverId, defaultRep, ranks, roles, commands, permissions } = bot.config as unknown as Config
    if (!commands) throw new Error('No commands found')
    if (!permissions) throw new Error('No permissions found')
    if (guild_id != serverId) throw new Error('ServerIds do not match')
    // find the user if they exist or add if they dont
    const caller = await prisma.user.findUnique({ where: { discordid: member.user?.id }}) ?? await prisma.user.create({ data: {
      discordid: member.user.id,
      name: member.user.username,
      avatar: member.user.avatar
    }})
    await updateUser(member.user.id, member.user.username, member.user.avatar, prisma)

    const callerRep = await prisma.rep.findUnique({where: {userid_serverid: {userid: caller.id, serverid: guild_id}}}) ?? await prisma.rep.create({data: {userid: caller.id, serverid: guild_id, rep: defaultRep}})

    // find command from config
    const configCommand: Command | undefined = _objToMap(commands).get(data.name) ?? undefined
    console.log(data.name)
    if (!configCommand) throw new Error(`Command ${data.name} not found`)

    // check if the user is banned from using reppo
    if (callerRep.unlocktime && callerRep.unlocktime.getDate() < new Date().getDate())
      await prisma.rep.update({ where: { userid_serverid: { userid: callerRep.userid, serverid: guild_id } }, data: { unlocktime: null, locked: false }})
    if (callerRep.locked) throw new Error('You are locked from using reppo on this server')

    // find permissions
    const commandPermissions = permissions.filter((p: Permission) => p.command === data.name)
    if (!commandPermissions) throw new Error(`Cannot find permissions for ${data.name}`)
    console.log(commandPermissions)
    let userPerm: Permission | undefined
    console.log(`command: ${configCommand}`)
    switch(configCommand.permType) {
      case 'rank':
        const rank = ranks?.find(r => r.minRep <= callerRep.rep)
        if (!rank) throw new Error('You do not have the proper rank to call this command')
        userPerm = commandPermissions.find(p => p.allowed === rank.name)
        break
      case 'role':
        const role = roles?.find(r => member.roles?.includes(r.roleid))
        if (!role) throw new Error('You do not have the proper role to call this command')
        userPerm = commandPermissions.find(p => p.allowed === role.name)
        break
      case 'all':
        userPerm = commandPermissions.find(p => p.allowed === 'all')
        break
      default:
        throw new Error(`Invalid Permission Type on ${data.name}`)
    }

    if (!userPerm) throw new Error('You do not have permission to call this command')

    const action = await prisma.action.findUnique({ where: { serverid_commandname: { serverid: guild_id, commandname: data.name } } }) ?? await prisma.action.create({ data: { serverid: guild_id, commandname: data.name } })
    const calls = await prisma.transaction.findMany({ where: { senderid: caller.id, actionid: action.id }, take: userPerm.opts.maxCalls ? userPerm.opts.maxCalls : 1, orderBy: { time: 'desc' } }) ?? []
    if (userPerm.opts.maxCalls && calls.length >= userPerm.opts.maxCalls) throw new Error(`You have reached the max calls of ${userPerm.opts.maxCalls} for your permission level`)

    if (calls && calls.length > 0) {
      const lastCall = calls[0]
      const originalTimeOfCall = new Date(lastCall.time)
      const timeOfNextCall = new Date(originalTimeOfCall.setMonth(originalTimeOfCall.getMonth() + (userPerm.opts.cooldown ?? 0)))
      if (timeOfNextCall.getDate() > new Date().getDate()) throw new Error(`You must wait until ${timeOfNextCall.toLocaleString()} to use this command again`)
    }

    if (configCommand.type === 'info' && !data.resolved?.members) {
      if (!userPerm.opts.info) throw new Error('No info provided in the command')
      let infoBlock: InfoBlock = {}
      infoBlock = {
        name: userPerm.opts.info?.includes('name') ? member.user.username : '',
        rep: userPerm.opts.info?.includes('rep') ? callerRep.rep : undefined,
        rank: userPerm.opts.info?.includes('rank') ? ranks?.find(r => r.minRep <= callerRep.rep)?.name : '',
        pos: userPerm.opts.info?.includes('pos') ? await (await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' } })).findIndex(rep => rep.userid === callerRep.userid) + 1 : undefined
      }
      await prisma.$disconnect()
      return `${infoBlock.name}'s rep is ${infoBlock.rep} (${infoBlock.rank}), ${infoBlock.pos}${infoBlock.pos == 1 ? 'st' : infoBlock.pos == 2 ? 'nd' : infoBlock.pos == 3 ? 'rd' : 'th'} in the server`
    }

    const targetUsers: Member[] = Object.entries(data.resolved?.members ?? {}).map(([k, v]) => ({ ...v, user: _objToMap(data?.resolved?.users).get(k) } as Member)) ?? []
    if (!targetUsers) throw new Error('Target user does not exist')
    if (targetUsers.length > 1) throw new Error('Only one target user is allowed')
    const targetUser: Member = targetUsers[0]
    if (!targetUser || !targetUser.user) throw new Error('Target user does not exist')
    const target = await prisma.user.findUnique({ where: { discordid: targetUser.user?.id } }) ?? await prisma.user.create({ data: { discordid: targetUser.user.id } })
    const targetRep = await prisma.rep.findUnique({ where: { userid_serverid: { userid: target.id, serverid: guild_id } } }) ?? await prisma.rep.create({ data: { userid: target.id, serverid: guild_id, rep: defaultRep } })
    if (!target || !targetRep) throw new Error('Target user does not exist')
    updateUser(target.discordid, targetUser.user.username, targetUser.user.avatar ,prisma)

    console.log(`${member.user?.username} called command ${data.name} on ${Object.entries(targetUsers).length > 0 ? `${targetUsers.map(v => v.user?.username).join(',')} on server ${guild_id}` : `server ${guild_id}`}`)

    if (userPerm.allowedOn) {
      if (target.discordid === caller.discordid) throw new Error(`Cannot call command ${data.name} on yourself`)
      switch(configCommand.permType) {
        case 'rank':
          const targetRank = ranks?.find(r => r.minRep <= targetRep.rep)
          if (!targetRank) throw new Error('Target user does not have a rank')
          if (!userPerm.allowedOn.includes(targetRank.name)) throw new Error(`Cannot call ${data.name} on ${targetRank.name}`)
              break
        case 'role':
          const targetRole = roles?.find(r => targetUser.roles?.includes(r.roleid))
          if (!targetRole) throw new Error('Target user does not have a rank')
          if (!userPerm.allowedOn.includes(userPerm.command)) throw new Error(`Cannot call ${data.name} on ${targetRole.name}`)
          break
        case 'all':
          break
      }
    }

    let returnMessage = ''
    switch(configCommand.type) {
      case 'adjust':
        if (!targetRep || !target || !targetUser.user) throw new Error(`No target user provided for command ${data.name}`)
          const updatedTarget = await prisma.rep.update({
            where: {
              userid_serverid: { userid: target.id, serverid: guild_id }
            },
            data: {
              rep: targetRep.rep + (userPerm?.opts.amount ?? 0) >= defaultRep ? targetRep.rep + (userPerm?.opts.amount ?? 0) : 0
            }
        })
        if (!updatedTarget) {
          throw new Error("User not found")
        }
        returnMessage = `${targetUser.user.username}'s rep has been adjusted by ${userPerm?.opts.amount ?? 0} (${data.name})`
        break
      case 'set': case 'ban':
        if (!targetRep || !target || !targetUser.user) throw new Error(`No target user provided for command ${data.name}`)
        const amount = userPerm.opts.amount != null && configCommand.type === 'ban' ? { name: 'amount', value: userPerm.opts.amount.toString() } : data?.options?.find((option: Option) => option.name === 'amount')
        if (!amount) throw new Error('No amount provided')
        if (configCommand.type === 'ban') {
          if (parseInt(amount.value) < 0) {
            // unban the person
            const unbanned = await prisma.rep.update({
              where: { userid_serverid: { userid: targetRep.userid, serverid: targetRep.serverid } },
              data: {
                unlocktime: null,
                locked: false
              }
            })
            if (!unbanned) {
              throw new Error("User not found")
            }
            returnMessage = `Successfully unbanned ${targetUser.user.username}`
          } else if (parseInt(amount.value) == 0) {
            // ban forever
            const banned = await prisma.rep.update({
              where: { userid_serverid: { userid: targetRep.userid, serverid: targetRep.serverid } },
              data: {
                locked: true,
                unlocktime: null
              }
            })
            if (!banned) {
              throw new Error("User not found")
            }
            returnMessage = `Successfully banned ${targetUser.user.username}`
          } else {
            // kick for x months
            const unlockTime = new Date()
            unlockTime.setMonth(unlockTime.getMonth() + parseInt(amount.value))
            const kicked = await prisma.rep.update({
              where: { userid_serverid: { userid: targetRep.userid, serverid: targetRep.serverid } },
              data: {
                locked: true,
                unlocktime: unlockTime
              }
            })
            if (!kicked) {
              throw new Error("User not found")
            }
            returnMessage = `Successfully kicked ${targetUser.user.username} for ${amount.value} months`
          }
        } else {
          // do set
          // fix this
          if (parseInt(amount.value) > (userPerm.opts.maxAmount ?? 0) || parseInt(amount.value) < (userPerm.opts.minAmount ?? 0)) {
            throw new Error(`Amount is out of range, please make it more than ${userPerm.opts.minAmount} and less than ${userPerm.opts.maxAmount}`)
          }
          const updatedTarget = await prisma.rep.update({
            where: {
              userid_serverid: { userid: target.id, serverid: guild_id }
            },
            data: {
              rep: parseInt(amount.value)
            }
          })
          if (!updatedTarget) {
            throw new Error("User not found")
          }
          returnMessage = `Successfully set ${targetUser.user.username}'s rep to ${amount.value}`
        }
        break
      case 'info':
        const infoBlock = {
           name: userPerm.opts.info?.includes('name') ? targetUser.user.username : undefined,
           rep: userPerm.opts.info?.includes('rep') ? targetRep.rep : undefined,
           rank: userPerm.opts.info?.includes('rank') ? ranks?.find(r => r.minRep <= targetRep.rep)?.name : undefined,
           pos: userPerm.opts.info?.includes('pos') ? await (await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' } })).findIndex(rep => rep.userid === targetRep.userid) + 1 : undefined
        }
        returnMessage = `${infoBlock.name}'s rep is ${infoBlock.rep} (${infoBlock.rank}), ${infoBlock.pos}${infoBlock.pos == 1 ? 'st' : infoBlock.pos == 2 ? 'nd' : infoBlock.pos == 3 ? 'rd' : 'th'} in the server`
        break
    }

    // record the transaction
    const newTransaction = await prisma.transaction.create({
      data: {
        senderid: caller.id,
        receiverid: target ? target.id : null,
        actionid: action.id,
        serverid: serverId
      }
    })
    if (!newTransaction) {
      throw new Error("Transaction not created")
    }
    await prisma.$disconnect()
    return returnMessage
  } catch(e) {
    await prisma.$disconnect()
    console.log(e)
    throw e
  }
}

const _objToMap = (obj: any) => {
    const map = new Map()
    Object.keys(obj).forEach(key => {
        map.set(key, obj[key])
    })
    return map
}

const reply = async (interactionId: string, message: string, token: string) => {
    const reply_url = `${BASE_URL}/interactions/${interactionId}/${token}/callback`
    const json = JSON.stringify({
        type: 4,
        data: {
            content: message
        }
    })
    axios.post(reply_url, json, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(res => res.data)
    .then(data => { console.log(data)})
    .catch(err => {throw new Error(err)})
}

const callCommand2 = async (command: Interaction) => {
  const prisma = new PrismaClient()
  try {
    const { guild_id, member, data }: Interaction = command
    if (!guild_id) throw new Error('No serverId provided')
    if (!member) throw new Error('No caller provided')
    if (!member.user) throw new Error('No caller user provided')
    if (!data) throw new Error('No data provided')

    const bot = await prisma.bot.findUnique({where: { serverid: guild_id }})
    if (!bot) throw new Error('No bot found')
    if (!bot.config) throw new Error('No config found')
    const { serverId, defaultRep, commands, permissions } = bot.config as unknown as Config
    if (!commands) throw new Error('No commands found')
    if (!permissions) throw new Error('No permissions found')
    if (guild_id != serverId) throw new Error('ServerIds do not match')
    const caller = await grabUser(member, prisma)
    const callerRep = await grabRep(caller, guild_id, defaultRep ?? 0, prisma)
    const configCommand: Command | undefined = _objToMap(commands).get(data.name) ?? undefined
    if (!configCommand) throw new Error(`Command ${data.name} not found`)
    await checkBan(callerRep, guild_id, prisma)
    const permission = await grabPermission(configCommand, callerRep, data.name, member, bot.config as unknown as Config, permissions)
    const action = await checkCalls(guild_id, data.name, caller, permission, prisma)
    if (configCommand.type === 'info' && !data.resolved?.members) {
      const message = await handleInfoCommand(permission, guild_id, (bot.config as unknown as Config).ranks ?? [], member, callerRep, prisma)
      await recordTransaction(caller, null, action, guild_id, prisma)
      await prisma.$disconnect()
      return message
    }
    await prisma.$disconnect()
  } catch(err) {
    await prisma.$disconnect()
    throw err
  }
}

const grabUser = async (member: Member, prisma: PrismaClient) => {
  if (!member) throw new Error('No caller provided')
  if (!member.user) throw new Error('No caller user provided')
  const caller = await prisma.user.findUnique({ where: { discordid: member.user?.id }}) ?? await prisma.user.create({ data: {
    discordid: member.user.id,
    name: member.user.username,
    avatar: member.user.avatar
  }})
  if(!caller) throw new Error('Failed to create caller')
  await updateUser(member.user.id, member.user.username, member.user.avatar, prisma)
  return caller
}

const grabRep = async (caller: User, guild_id: string, defaultRep: number, prisma: PrismaClient) => {
  const callerRep = await prisma.rep.findUnique({where: {userid_serverid: {userid: caller.id, serverid: guild_id}}}) ?? await prisma.rep.create({data: {userid: caller.id, serverid: guild_id, rep: defaultRep}})
  if(!callerRep) throw new Error('Failed to create rep')
  return callerRep
}

const checkBan = async (callerRep: Rep, guild_id: string, prisma: PrismaClient) => {
  if (callerRep.unlocktime && callerRep.unlocktime.getDate() < new Date().getDate())
      await prisma.rep.update({ where: { userid_serverid: { userid: callerRep.userid, serverid: guild_id } }, data: { unlocktime: null, locked: false }})
    if (callerRep.locked) throw new Error('You are locked from using reppo on this server')
}

const grabPermission = (configCommand: Command, callerRep: Rep, name: string, member: Member, config: Config, permissions: Permission[]) => {
  const commandPermissions = permissions.filter((p: Permission) => p.command === name)
    if (!commandPermissions) throw new Error(`Cannot find permissions for ${name}`)
    console.log(commandPermissions)
    let userPerm: Permission | undefined
    console.log(`command: ${configCommand}`)
    switch(configCommand.permType) {
      case 'rank':
        const rank = config.ranks?.find(r => r.minRep <= callerRep.rep)
        if (!rank) throw new Error('You do not have the proper rank to call this command')
        userPerm = commandPermissions.find(p => p.allowed === rank.name)
        break
      case 'role':
        const role = config.roles?.find(r => member.roles?.includes(r.roleid))
        if (!role) throw new Error('You do not have the proper role to call this command')
        userPerm = commandPermissions.find(p => p.allowed === role.name)
        break
      case 'all':
        userPerm = commandPermissions.find(p => p.allowed === 'all')
        break
      default:
        throw new Error(`Invalid Permission Type on ${name}`)
  }
  if (!userPerm) throw new Error('You do not have permission to call this command')

  return userPerm
}

const checkCalls = async (guild_id: string, name: string, caller: User, permission: Permission, prisma: PrismaClient) => {
  const action = await prisma.action.findUnique({ where: { serverid_commandname: { serverid: guild_id, commandname: name } } }) ?? await prisma.action.create({ data: { serverid: guild_id, commandname: name } })
    const calls = await prisma.transaction.findMany({ where: { senderid: caller.id, actionid: action.id }, take: permission.opts.maxCalls ? permission.opts.maxCalls : 1, orderBy: { time: 'desc' } }) ?? []
    if (permission.opts.maxCalls && calls.length >= permission.opts.maxCalls) throw new Error(`You have reached the max calls of ${permission.opts.maxCalls} for your permission level`)

    if (calls && calls.length > 0) {
      const lastCall = calls[0]
      const originalTimeOfCall = new Date(lastCall.time)
      const timeOfNextCall = new Date(originalTimeOfCall.setMonth(originalTimeOfCall.getMonth() + (permission.opts.cooldown ?? 0)))
      if (timeOfNextCall.getDate() > new Date().getDate()) throw new Error(`You must wait until ${timeOfNextCall.toLocaleString()} to use this command again`)
    }
    return action
}

const recordTransaction = async (caller: User, target: User | null, action: Action, guild_id: string, prisma: PrismaClient) => {
  const newTransaction = await prisma.transaction.create({
    data: {
      senderid: caller.id,
      receiverid: target ? target.id : null,
      actionid: action.id,
      serverid: guild_id
    }
  })
  if (!newTransaction) throw new Error("Transaction not created")
}

const handleInfoCommand = async (permission: Permission, guild_id: string, ranks: Rank[], targetUser: Member, targetRep: Rep, prisma: PrismaClient) => {
  if (!permission.opts.info) throw new Error('No info provided in the command')
  const infoBlock = {
    name: permission.opts.info?.includes('name') ? targetUser.user?.username : undefined,
    rep: permission.opts.info?.includes('rep') ? targetRep.rep : undefined,
    rank: permission.opts.info?.includes('rank') ? ranks?.find(r => r.minRep <= targetRep.rep)?.name : undefined,
    pos: permission.opts.info?.includes('pos') ? await (await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' } })).findIndex(rep => rep.userid === targetRep.userid) + 1 : undefined
 }
 return `${infoBlock.name}'s rep is ${infoBlock.rep} (${infoBlock.rank}), ${infoBlock.pos}${infoBlock.pos == 1 ? 'st' : infoBlock.pos == 2 ? 'nd' : infoBlock.pos == 3 ? 'rd' : 'th'} in the server`
}

export default {
    callCommand,
    reply
}
