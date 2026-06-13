"use client"

import { useState } from "react"
import Link from "next/link"
import { VideoPlayer } from "@/components/video-player"
import { SiteHeader } from "@/components/site-header"
import { ArrowLeftIcon, LinkIcon, PlayIcon } from "@/components/icons"

const examples = [
  { label: "HLS (.m3u8)", desc: "Apple HTTP Live Streaming" },
  { label: "DASH (.mpd)", desc: "MPEG-DASH adaptive streaming" },
  { label: "Direct video", desc: ".mp4, .webm and more" },
]

export default function WatchPage() {
  const [input, setInput] = useState("")
  const [activeUrl, setActiveUrl] = useState("")
  const [touched, setTouched] = useState(false)

  const trimmed = input.trim()
  const isValid = /^https?:\/\/.+/i.test(trimmed)

  function handleLoad(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    setActiveUrl(trimmed)
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to channels
        </Link>

        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <LinkIcon className="h-6 w-6 text-primary" />
            Play any stream link
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Paste a direct stream URL below and press Load. The player auto-detects HLS, DASH, and direct video sources.
          </p>
        </div>

        <form onSubmit={handleLoad} className="glass rounded-2xl border border-border p-4 sm:p-5">
          <label htmlFor="stream-url" className="mb-2 block text-sm font-medium">
            Stream URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="stream-url"
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/stream/index.m3u8"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlayIcon className="h-4 w-4" />
              Load
            </button>
          </div>
          {touched && !isValid && (
            <p className="mt-2 text-xs text-red-400">Please enter a valid URL starting with http:// or https://</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <div
                key={ex.label}
                className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs"
                title={ex.desc}
              >
                <span className="font-semibold">{ex.label}</span>
              </div>
            ))}
          </div>
        </form>

        {activeUrl && (
          <div className="mt-6 animate-fade-in">
            <VideoPlayer key={activeUrl} url={activeUrl} title="Custom stream" />
            <p className="mt-3 break-all text-xs text-muted-foreground">
              Now playing: <span className="text-foreground/80">{activeUrl}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
