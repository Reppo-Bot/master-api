// discord types
import { DiscordUser } from "../../util"

export interface Member {
  user?: DiscordUser
  nick?: string
  avatar?: string
  roles: string[]
  joined_at: string
  premium_since?: string
  deaf: boolean
  mute: boolean
  pending?: boolean
  permissions?: string
  communication_disabled_until?: string
}

export interface RoleTags {
  bot_id?: string
  integration_id?: string
  premium_subscriber?: boolean
}

export interface Role {
  id: string
  name: string
  color: number
  hoist: boolean
  icon?: string
  unicode_emoji?: string
  positon: number
  permissions: string
  managed: boolean
  mentionable: boolean
  tags?: RoleTags
}

export interface Option {
  name: string
  value: string
}

export interface Overwrite {
  id: string
  type: number
  allow: string
  deny: string
}

export interface ThreadMetadata {
  archived: boolean
  auto_archive_duration: number
  archive_timestamp: string
  locked: boolean
  invitable?: boolean
  create_timestamp?: string
}

export interface ThreadMember {
  id?: string
  user_id?: string
  join_timestamp: string
  flags: number
}

export interface Channel {
  id: string
  type: number
  guild_id?: string
  position?: number
  permission_overwrites?: Overwrite[]
  name?: string
  topic?: string
  nsfw?: boolean
  last_message_id?: string
  bitrate?: number
  user_limit?: number
  rate_limit_per_user?: number
  recipients?: DiscordUser[]
  icon?: string
  owner_id?: string
  application_id?: string
  parent_id?: string
  last_pin_timestamp?: string
  rtc_region?: string
  video_quality_mode?: number
  message_count?: number
  member_count?: number
  thread_metadata?: ThreadMetadata
  member?: ThreadMember
  default_auto_archive_duration?: number
  permissions?: string
}

export interface Attachment {
  id: string
  filename: string
  description?: string
  content_type?: string
  size: number
  url: string
  proxy_url: string
  height?: number
  width?: number
  ephemeral?: boolean
}

export interface EmbedFooter {
  text: string
  icon_url?: string
  proxy_icon_url?: string
}

export interface EmbedImage {
  url: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface EmbedThumbnail {
  url: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface EmbedVideo {
  url: string
  proxy_url?: string
  height?: number
  width?: number
}

export interface EmbedProvider {
  name?: string
  url?: string
}

export interface EmbedAuthor {
  name: string
  url?: string
  icon_url?: string
  proxy_icon_url?: string
}

export interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface Embed {
  title?: string
  type?: string
  description?: string
  url?: string
  timestamp?: string
  color?: number
  footer?: EmbedFooter
  image?: EmbedImage
  thumbnail?: EmbedThumbnail
  video?: EmbedVideo
  provider?: EmbedProvider
  author?: EmbedAuthor
  fields?: EmbedField[]
}

export interface Reaction {
  count: number
  me: boolean
  emoji: Emoji
}

export interface MessageActivity {
  type: number
  party_id?: string
}

export interface TeamMember {
  membership_state: number
  permissions: string[]
  team_id: string
  user: DiscordUser
}

export interface Team {
  icon: string
  id: string
  members: TeamMember[]
  name: string
  owner_user_id: string
}

export interface Application {
  id: string
  name: string
  icon?: string
  description?: string
  rpc_origins?: string[]
  bot_public?: boolean
  bot_require_code_grant?: boolean
  terms_of_service_url?: string
  privacy_policy_url?: string
  owner?: DiscordUser
  summary: string
  verify_key?: string
  team?: Team
  guild_id?: string
  primary_sku_id?: string
  slug?: string
  cover_image?: string
  flags?: number
}

export interface MessageReference {
  message_id?: string
  channel_id?: string
  guild_id?: string
  fail_if_not_exists?: boolean
}

export interface MessageInteraction {
  id: string
  type: number
  name: string
  user: DiscordUser
  member?: Member
}

export interface MessageComponent {
  type: number
}

export interface ActionRow extends MessageComponent {
  type: number
  components: MessageComponent[]
}

export interface Button extends MessageComponent {
  type: number
  style: number
  label?: string
  emoji?: Emoji
  custom_id?: string
  url?: string
  disabled?: boolean
}

export interface SelectOption {
  label: string
  value: string
  description?: string
  emoji?: Emoji
  default?: boolean
}

export interface SelectMenu extends MessageComponent {
  type: number
  custom_id: string
  options: SelectOption[]
  placeholder?: string
  min_values?: number
  max_values?: number
  disabled?: boolean
}

export interface TextInput extends MessageComponent {
  type: number
  custom_id: string
  style: number
  label: string
  min_length?: number
  max_length?: number
  required?: boolean
  value?: string
  placeholder?: string
}

export interface StickerItem {
  id: string
  name: string
  format_type: number
}

export interface Sticker {
  id: string
  pack_id?: string
  name: string
  description?: string
  tags: string // comma separated
  asset: string
  type: number
  format_type: number
  available?: boolean
  guild_id?: string
  user?: DiscordUser
  sort_value?: number
}

export interface Message {
  id: string
  channel_id: string
  guild_id?: string
  author: DiscordUser
  member?: Member
  content: string
  timestamp: string
  edited_timestamp: string
  tts: boolean
  mention_everyone: boolean,
  mentions: DiscordUser[],
  mention_roles: Role[],
  attachments: Attachment[],
  embeds: Embed[],
  reactions: Reaction[],
  nonce?: string | number
  pinned: boolean
  webhook_id?: string
  type: number
  activity?: MessageActivity
  application?: Application
  application_id?: string
  message_reference?: MessageReference
  flags?: number
  referenced_message?: Message
  interaction?: MessageInteraction
  thread?: Channel
  components?: MessageComponent[]
  sticker_items?: StickerItem[]
  stickers?: Sticker[]
}

export interface Resolved {
  users?: Map<string, DiscordUser> //{[id: string]: User}
  members?: Map<string, Member> //{[id: string]: Member}
  roles?: Map<string, Role> //{[id: string]: Role}
  channels?: Map<string, Channel> //{[id: string]: Channel}
  messages?: Map<string, Message> //{[id: string]: Message}
  attachments?: Map<string, Attachment> //{[id: string]: Attachment}
}

export interface Emoji {
  id: string
  name: string
  animated?: boolean
}

export interface SelectOption {
  label: string
  value: string
  description?: string
  emoji?: Emoji
  default?: boolean
}

export interface InteractionData {
  id: string
  name: string
  type: number
  resolved?: Resolved
  options?: Option[]
  custom_id?: string
  component_type?: number
  values?: undefined
  target_id?: string
  components?: MessageComponent[]
}

export interface Interaction {
  id: string
  application_id: string
  type: number
  data?: InteractionData
  guild_id?: string
  channel_id?: string
  member?: Member
  user?: DiscordUser
  token: string
  version: number
  message?: Message
  locale?: string
  guild_locale?: string
}

// reppo types

export interface Rank {
  name: string
  minRep: number
}

export interface Permission {
  command: string
  allowed: string
  allowedOn?: string[]
  opts: OtherOptions
}

export interface Command {
  name: string
  description: string
  type: string
  permType: string // role, rank, all
}

export interface ReppoRole {
  name: string
  roleid: string
  priority: number
}

export interface OtherOptions {
  amount?: number
  cooldown?: number
  maxCalls?: number
  maxAmount?: number
  minAmount?: number
  info?: string[]
  leaderboard?: boolean
}

export interface Config {
  serverId: string
  defaultRep: number
  ranks?: Rank[]
  roles?: ReppoRole[]
  permissions?: Permission[]
  commands?: Map<string, Command>
}

export interface InfoBlock {
  name?: string
  rank?: string
  rep?: number
  pos?: number
}
