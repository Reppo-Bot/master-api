export interface Server {
    id: string
    name: string,
    bio: string,
    avatar: string
}

export interface Config {
    serverId: string
    defaultRep: number
    name: string
    bio: string
}