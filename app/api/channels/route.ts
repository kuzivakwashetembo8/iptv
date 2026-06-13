import { NextResponse } from "next/server"
import { getAllChannels } from "@/lib/data"
import type { Channel } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim().toLowerCase()
  const category = searchParams.get("category") || ""
  const country = searchParams.get("country") || ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10))
  const pageSize = Math.min(120, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "60", 10)))

  const all = await getAllChannels()

  let filtered: Channel[] = all
  if (category) filtered = filtered.filter((c) => c.category === category)
  if (country) filtered = filtered.filter((c) => c.country === country)
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.countryName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    )
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const channels = filtered.slice(start, start + pageSize)

  return NextResponse.json({
    channels,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  })
}
