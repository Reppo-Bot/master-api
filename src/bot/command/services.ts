import { Action, PrismaClient, Rep, User } from "@prisma/client";
import axios from "axios";
import { Interaction, Config, Command, Permission, Member, InfoBlock, Option, InteractionData, Rank, Target } from "./types";
import { BASE_URL, updateUser, _objToMap} from "../../util";

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

const callCommand = async (command: Interaction) => {
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
    const config = bot.config as unknown as Config
    
    const { serverId, defaultRep, commands, permissions } = config
    if (!commands) throw new Error('No commands found')
    if (!permissions) throw new Error('No permissions found')
    if (guild_id != serverId) throw new Error('ServerIds do not match')
    
    const caller = await grabUser(member, prisma)
    const callerRep = await grabRep(caller, guild_id, defaultRep ?? 0, prisma)

    const me = { targetUser: member, target: caller, targetRep: callerRep } as Target

    const configCommand: Command | undefined = _objToMap(commands).get(data.name) ?? undefined
    if (!configCommand) throw new Error(`Command ${data.name} not found`)
    configCommand.name = data.name
    
    await checkBan(guild_id, callerRep, prisma)
    
    const permission = await grabPermission(configCommand, config, me, permissions)
    const action = await checkCalls(data.name, guild_id, permission, caller, prisma)
    
    if (configCommand.type === 'info' && !data.resolved?.members) {
      const message = await handleInfoCommand(permission, guild_id, config.ranks ?? [], me, prisma)
      await recordTransaction(caller, null, action, guild_id, prisma)
      await prisma.$disconnect()
      return message
    }

    const targetUser = grabTargetDiscordUser(data)
    const target = await grabUser(targetUser, prisma)
    const targetRep = await grabRep(target, guild_id, defaultRep ?? 0, prisma)

    const theTarget = { targetUser, target, targetRep } as Target
    
    canCallOnUser(permission, caller, theTarget, configCommand, config)

    if (!targetRep || !target || !targetUser.user) throw new Error(`No target user provided for command ${data.name}`)
    let response = ''
    switch(configCommand.type) {
      case 'adjust':
        response = await handleAdjustCommand(guild_id, data.name, permission, theTarget, prisma)
        break
      case 'set': case 'ban':
        const amount = permission.opts.amount != null && configCommand.type === 'ban' ? 
        { name: 'amount', value: permission.opts.amount.toString() } : 
        data?.options?.find((option: Option) => option.name === 'amount')
        if (!amount) throw new Error('No amount provided')

        response = configCommand.type === 'ban' ? 
        await handleBanCommand(theTarget, amount, prisma) : 
        await handleSetCommand(guild_id, permission, amount, theTarget, prisma)
        break
      case 'info':
        response = await handleInfoCommand(permission, guild_id, config.ranks ?? [], theTarget, prisma)
        break
    }

    await recordTransaction(caller, target, action, guild_id, prisma)
    await prisma.$disconnect()
    return response
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

const checkBan = async (guild_id: string, callerRep: Rep, prisma: PrismaClient) => {
  const { unlocktime, userid } = callerRep
  let rep = callerRep
  if (unlocktime && unlocktime.getDate() < new Date().getDate())
      rep = await prisma.rep.update({ where: { userid_serverid: { userid: userid, serverid: guild_id } }, data: { unlocktime: null, locked: false }})
  if (rep.locked) throw new Error('You are locked from using reppo on this server')
}

const grabPermission = (configCommand: Command, config: Config, theTarget: Target, permissions: Permission[]) => {
  const { targetUser, targetRep } = theTarget
  const { name, permType } = configCommand
  const commandPermissions = permissions.filter((p: Permission) => p.command === configCommand.name)
    if (!commandPermissions) throw new Error(`Cannot find permissions for ${name}`)
    let userPerm: Permission | undefined
    switch(permType) {
      case 'rank':
        const rank = config.ranks?.find(r => r.minRep <= targetRep.rep)
        if (!rank) throw new Error('You do not have the proper rank to call this command')
        userPerm = commandPermissions.find(p => p.allowed === rank.name)
        break
      case 'role':
        const roles = config.roles?.filter(r => targetUser?.roles?.includes(r.roleid))
      	console.log(roles)
        if (!roles) throw new Error('You do not have the proper role to call this command')
	const userPerms = commandPermissions.filter(p => roles.map(r => r.name).includes(p.allowed))
        userPerm = userPerms.sort((a, b) => {
	  const role1 = roles.find(r => r.name === a.allowed) 
	  const role2 = roles.find(r => r.name === b.allowed)
	  if(!role1 && !role2) return 0
	  if(!role1) return 1
	  if(!role2) return -1
	  return role1.priority - role2.priority
	})[0]
	console.log(userPerm)
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

const checkCalls = async (name: string, guild_id: string, permission: Permission, caller: User, prisma: PrismaClient) => {
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

const grabTargetDiscordUser = (data: InteractionData) => {
  const targetUsers: Member[] = Object.entries(data.resolved?.members ?? {}).map(([k, v]) => ({ ...v, user: _objToMap(data?.resolved?.users).get(k) } as Member)) ?? []
    if (!targetUsers) throw new Error('Target user does not exist')
    if (targetUsers.length > 1) throw new Error('Only one target user is allowed')
    const targetUser: Member = targetUsers[0]
    if (!targetUser || !targetUser.user) throw new Error('Target user does not exist')
    return targetUser
}

const canCallOnUser = (permission: Permission, caller: User, theTarget: Target, configCommand: Command, config: Config) => {
  const { target, targetUser, targetRep } = theTarget
  if (target.id === caller.id) throw new Error(`Cannot call command ${configCommand.name} on yourself`)
  if (permission.on && permission.on.length > 0) {
    switch(configCommand.permType) {
      case 'rank':
        const targetRank = config.ranks?.find(r => r.minRep <= targetRep.rep)
        if (!targetRank) throw new Error('Target user does not have a rank')
        if (!permission.on.includes(targetRank.name)) throw new Error(`Cannot call ${configCommand.name} on ${targetRank.name}`)
            break
      case 'role':
        const targetRoles = config.roles?.filter(r => targetUser.roles?.includes(r.roleid))
        if (!targetRoles) throw new Error('Target user does not have a role used in reppo')
        if (!targetRoles.map(r => r.name).some(r => permission.on?.includes(r))) throw new Error(`${target.name} does not have any of the required roles to be the target of this command`)
        break
    }
  }
  return true
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

const handleAdjustCommand = async (guild_id: string, name: string, permission: Permission, theTarget: Target,  prisma: PrismaClient) => {
  const { target, targetUser, targetRep } = theTarget
  const updatedTarget = await prisma.rep.update({
    where: {
      userid_serverid: { userid: target.id, serverid: guild_id }
    },
    data: {
      rep: targetRep.rep + (permission?.opts.amount ?? 0)
    }
})
if (!updatedTarget) throw new Error("User not found")
return `${targetUser.user?.username}'s rep has been adjusted by ${permission?.opts.amount ?? 0} (${name})`
}

const handleBanCommand = async (theTarget: Target, amount: Option, prisma: PrismaClient) => {
  const { targetUser, targetRep } = theTarget
  if(!targetRep) throw new Error("User rep not found")
  if (parseInt(amount.value) < 0) {
    // unban the person
    const unbanned = await prisma.rep.update({
      where: { userid_serverid: { userid: targetRep.userid, serverid: targetRep.serverid } },
      data: {
        unlocktime: null,
        locked: false
      }
    })
    if (!unbanned) throw new Error("User not found")
    return `Successfully unbanned ${targetUser.user?.username}`
  }
  
  if (parseInt(amount.value) == 0) {
    // ban forever
    const banned = await prisma.rep.update({
      where: { userid_serverid: { userid: targetRep.userid, serverid: targetRep.serverid } },
      data: {
        locked: true,
        unlocktime: null
      }
    })
    if (!banned) throw new Error("User not found")
    return `Successfully banned ${targetUser.user?.username}`
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
    if (!kicked) throw new Error("User not found")
    return `Successfully kicked ${targetUser.user?.username} for ${amount.value} months`
  }
}

const handleInfoCommand = async (permission: Permission, guild_id: string, ranks: Rank[], theTarget: Target, prisma: PrismaClient) => {
  const { targetUser, targetRep } = theTarget
  if (!permission.opts.info) throw new Error('No info provided in the command')
  const infoBlock = {
    name: permission.opts.info?.includes('name') ? targetUser.user?.username : undefined,
    rep: permission.opts.info?.includes('rep') ? targetRep.rep : undefined,
    rank: permission.opts.info?.includes('rank') ? ranks?.find(r => r.minRep <= targetRep.rep)?.name : undefined,
    pos: permission.opts.info?.includes('pos') ? await (await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' } })).findIndex(rep => rep.userid === targetRep.userid) + 1 : undefined
 }
 return `${infoBlock.name}'s rep is ${infoBlock.rep} (${infoBlock.rank ?? 'No rank'}), ${infoBlock.pos}${infoBlock.pos == 1 ? 'st' : infoBlock.pos == 2 ? 'nd' : infoBlock.pos == 3 ? 'rd' : 'th'} in the server`
}

const handleInfoCommandNoPerm = async (guild_id: string, ranks: Rank[], theTarget: Target, prisma: PrismaClient) => {
  const { targetUser, targetRep } = theTarget
  const infoBlock = {
    name: targetUser.user?.username,
    rep: targetRep.rep,
    rank: ranks?.find(r => r.minRep <= targetRep.rep)?.name,
    pos: await (await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' } })).findIndex(rep => rep.userid === targetRep.userid) + 1
 }
 return `${infoBlock.name}'s rep is ${infoBlock.rep} (${infoBlock.rank ?? 'No rank'}), ${infoBlock.pos}${infoBlock.pos == 1 ? 'st' : infoBlock.pos == 2 ? 'nd' : infoBlock.pos == 3 ? 'rd' : 'th'} in the server`
}

const handleSetCommand = async (guild_id: string, permission: Permission, amount: Option, theTarget: Target, prisma: PrismaClient) => {
  const { target, targetUser } = theTarget
  if (parseInt(amount.value) > (permission.opts.maxAmount ?? 0) || parseInt(amount.value) < (permission.opts.minAmount ?? 0)) {
    throw new Error(`Amount is out of range, please make it more than ${permission.opts.minAmount} and less than ${permission.opts.maxAmount}`)
  }
  const updatedTarget = await prisma.rep.update({
    where: {
      userid_serverid: { userid: target.id, serverid: guild_id }
    },
    data: {
      rep: parseInt(amount.value)
    }
  })
  if (!updatedTarget) throw new Error("User not found")
  return `Successfully set ${targetUser.user?.username}'s rep to ${amount.value}`
}

const callVibecheck = async (command: Interaction) => {
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
    const config = bot.config as unknown as Config
    
    const { defaultRep, } = config

    const caller = await grabUser(member, prisma)
    const callerRep = await grabRep(caller, guild_id, defaultRep ?? 0, prisma)
    
    if (!data.resolved?.members) {
      const me = { targetUser: member, target: caller, targetRep: callerRep } as Target
      const message = await handleInfoCommandNoPerm(guild_id, config.ranks ?? [], me, prisma)
      await prisma.$disconnect()
      return message
    }

    const targetUser = grabTargetDiscordUser(data)
    const target = await grabUser(targetUser, prisma)
    const targetRep = await grabRep(target, guild_id, defaultRep ?? 0, prisma)

    const theTarget = { targetUser: targetUser, target: target, targetRep: targetRep } as Target

    const message = await handleInfoCommandNoPerm(guild_id, config.ranks ?? [], theTarget, prisma)
    await prisma.$disconnect()
    return message
  } catch(e) {
    await prisma.$disconnect()
    throw e
  }
}

const callLeaderboard = async (command: Interaction) => {
  const { guild_id } = command
  const prisma = new PrismaClient()
  try {
    const userReps = await prisma.rep.findMany({ where: { serverid: guild_id }, orderBy: { rep: 'desc' }, take: 5 })
    const users = await prisma.user.findMany({ where: { id: { in: userReps.map(rep => rep.userid) } } })
    return userReps.map(rep => `${users.find(user => user.id === rep.userid)?.name} ${rep.rep}`).join('\n')
  } catch(e) {
    await prisma.$disconnect()
    throw e
  }
}

export default {
    callCommand,
    callVibecheck,
    callLeaderboard,
    reply
}
