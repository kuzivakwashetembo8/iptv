import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Channel, Meta } from "./types"

let channelsCache: Channel[] | null = null
let metaCache: Meta | null = null

const DATA_DIR = join(process.cwd(), "public", "data")

export async function getAllChannels(): Promise<Channel[]> {
  if (channelsCache) return channelsCache
  const raw = await readFile(join(DATA_DIR, "channels.json"), "utf8")
  channelsCache = JSON.parse(raw) as Channel[]
  return channelsCache
}

export async function getMeta(): Promise<Meta> {
  if (metaCache) return metaCache
  const raw = await readFile(join(DATA_DIR, "meta.json"), "utf8")
  metaCache = JSON.parse(raw) as Meta
  return metaCache
}

export async function getChannelById(id: number): Promise<Channel | undefined> {
  const channels = await getAllChannels()
  return channels.find((c) => c.id === id)
}
