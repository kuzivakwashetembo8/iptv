"use client"

import Link from "next/link"
import { useState } from "react"
import type { Channel } from "@/lib/types"
import { PlayIcon, TvIcon } from "./icons"

const categoryColors: Record<string, string> = {
  news: "oklch(0.7 0.18 25)",
  sports: "oklch(0.72 0.17 145)",
  movies: "oklch(0.7 0.16 300)",
  music: "oklch(0.75 0.15 330)",
  entertainment: "oklch(0.76 0.15 60)",
  kids: "oklch(0.78 0.16 200)",
  religious: "oklch(0.72 0.1 80)",
  documentary: "oklch(0.7 0.13 250)",
}

function badgeColor(category: string) {
  return categoryColors[category] || "var(--primary)"
}

export function ChannelCard({ channel }: { channel: Channel }) {
  const [imgError, setImgError] = useState(false)
  const showLogo = channel.logo && !imgError

  return (
    <Link
      href={`/player/${channel.id}`}
      className="group glass relative flex flex-col overflow-hidden rounded-xl border border-border transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-secondary/40 p-4">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.logo || "/placeholder.svg"}
            alt={`${channel.name} logo`}
            loading="lazy"
            crossOrigin="anonymous"
            onError={() => setImgError(true)}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <TvIcon className="h-10 w-10" />
            <span className="px-2 text-center text-xs font-medium leading-tight text-pretty">{channel.name}</span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <PlayIcon className="h-5 w-5 translate-x-px" />
          </span>
        </div>

        {channel.flag && (
          <span className="absolute right-2 top-2 text-lg leading-none drop-shadow" title={channel.countryName}>
            {channel.flag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground text-pretty">
          {channel.name}
        </h3>
        <div className="mt-auto flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: badgeColor(channel.category), backgroundColor: `color-mix(in oklch, ${badgeColor(channel.category)} 18%, transparent)` }}
          >
            {channel.category}
          </span>
          <span className="truncate text-xs text-muted-foreground">{channel.countryName}</span>
        </div>
      </div>
    </Link>
  )
}
