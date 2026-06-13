// Builds an enriched channels dataset from the local streams/*.m3u playlists
// and the iptv-org public API (categories, logos, country names/flags).
// Output: public/data/channels.json  +  public/data/meta.json
//
// Run: node scripts/build-channels.mjs

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const STREAMS_DIR = join(ROOT, "streams")
const OUT_DIR = join(ROOT, "public", "data")

const API = "https://iptv-org.github.io/api"

async function getJSON(path) {
  // Retry a few times with a timeout so transient CI network blips don't fail the build.
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)
      const res = await fetch(`${API}/${path}`, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastErr = err
      console.warn(`[build-channels] fetch ${path} attempt ${attempt} failed: ${err.message}`)
      await new Promise((r) => setTimeout(r, attempt * 1000))
    }
  }
  throw lastErr
}

function parseM3U(content, countryCode) {
  const lines = content.split(/\r?\n/)
  const items = []
  let pending = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith("#EXTINF")) {
      // #EXTINF:-1 tvg-id="ABC.us@East" tvg-logo="..." group-title="...",ABC (720p)
      const attrs = {}
      const attrRegex = /([a-zA-Z0-9-]+)="([^"]*)"/g
      let m
      while ((m = attrRegex.exec(line)) !== null) {
        attrs[m[1]] = m[2]
      }
      const commaIdx = line.indexOf(",")
      const name = commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : "Unknown"
      pending = {
        name,
        tvgId: attrs["tvg-id"] || "",
        logo: attrs["tvg-logo"] || "",
        group: attrs["group-title"] || "",
      }
    } else if (line && !line.startsWith("#") && pending) {
      items.push({ ...pending, url: line, country: countryCode })
      pending = null
    }
  }
  return items
}

// Strip resolution suffix like "(720p)" and feed markers for cleaner display
function cleanName(name) {
  return name.replace(/\s*\((\d{3,4}p|SD|HD|FHD|UHD|4K)\)\s*$/i, "").trim() || name
}

async function main() {
  console.log("[build-channels] Reading local playlists...")
  const files = readdirSync(STREAMS_DIR).filter((f) => f.endsWith(".m3u"))

  console.log("[build-channels] Fetching iptv-org API metadata...")
  let apiChannels = []
  let logos = []
  let countries = []
  try {
    ;[apiChannels, logos, countries] = await Promise.all([
      getJSON("channels.json"),
      getJSON("logos.json"),
      getJSON("countries.json"),
    ])
  } catch (err) {
    console.warn(
      `[build-channels] API enrichment unavailable (${err.message}). Building from local playlists without enriched logos/categories.`,
    )
  }

  // channel id -> categories
  const catById = new Map()
  for (const c of apiChannels) {
    catById.set(c.id, c.categories || [])
  }
  // channel id -> best logo (prefer in_use)
  const logoById = new Map()
  for (const l of logos) {
    if (!l.url) continue
    const existing = logoById.get(l.channel)
    if (!existing || (l.in_use && !existing.in_use)) {
      logoById.set(l.channel, { url: l.url, in_use: l.in_use })
    }
  }
  // country code -> { name, flag }
  const countryByCode = new Map()
  for (const c of countries) {
    countryByCode.set(c.code, { name: c.name, flag: c.flag })
  }

  const channels = []
  let id = 0
  for (const file of files) {
    const code = file.replace(/\.m3u$/, "").split("_")[0].toUpperCase()
    const content = readFileSync(join(STREAMS_DIR, file), "utf8")
    const items = parseM3U(content, code)
    for (const item of items) {
      // tvg-id format is like "ABC.us@East" -> channel id is "ABC.us"
      const channelId = item.tvgId ? item.tvgId.split("@")[0] : ""
      const categories = channelId ? catById.get(channelId) || [] : []
      const category = categories[0] || "general"
      const logo = item.logo || (channelId ? logoById.get(channelId)?.url : "") || ""
      const countryInfo = countryByCode.get(item.country) || { name: item.country, flag: "" }

      channels.push({
        id: id++,
        name: cleanName(item.name),
        url: item.url,
        logo,
        category,
        categories,
        country: item.country,
        countryName: countryInfo.name,
        flag: countryInfo.flag,
      })
    }
  }

  // Build meta: category and country facets with counts
  const catCounts = new Map()
  const countryCounts = new Map()
  for (const ch of channels) {
    catCounts.set(ch.category, (catCounts.get(ch.category) || 0) + 1)
    const key = ch.country
    countryCounts.set(key, (countryCounts.get(key) || 0) + 1)
  }

  const categories = [...catCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const countryFacets = [...countryCounts.entries()]
    .map(([code, count]) => {
      const info = countryByCode.get(code) || { name: code, flag: "" }
      return { code, name: info.name, flag: info.flag, count }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, "channels.json"), JSON.stringify(channels))
  writeFileSync(
    join(OUT_DIR, "meta.json"),
    JSON.stringify({
      total: channels.length,
      categories,
      countries: countryFacets,
      generatedAt: new Date().toISOString(),
    }),
  )

  console.log(
    `[build-channels] Wrote ${channels.length} channels, ${categories.length} categories, ${countryFacets.length} countries.`,
  )
}

main().catch((err) => {
  console.error("[build-channels] Failed:", err)
  // Never block a deploy: if a previously generated dataset is committed, fall back to it.
  if (existsSync(join(OUT_DIR, "channels.json")) && existsSync(join(OUT_DIR, "meta.json"))) {
    console.warn("[build-channels] Using existing committed dataset as fallback. Continuing build.")
    process.exit(0)
  }
  process.exit(1)
})
