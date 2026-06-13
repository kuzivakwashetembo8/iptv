import { notFound } from "next/navigation"
import Link from "next/link"
import { getAllChannels, getChannelById } from "@/lib/data"
import { VideoPlayer } from "@/components/video-player"
import { ChannelCard } from "@/components/channel-card"
import { SiteHeader } from "@/components/site-header"
import { ArrowLeftIcon } from "@/components/icons"

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const channelId = Number.parseInt(id, 10)
  if (Number.isNaN(channelId)) notFound()

  const channel = await getChannelById(channelId)
  if (!channel) notFound()

  const all = await getAllChannels()
  const related = all
    .filter((c) => c.id !== channel.id && (c.category === channel.category || c.country === channel.country))
    .slice(0, 12)

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to channels
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <VideoPlayer url={channel.url} poster={channel.logo || undefined} title={channel.name} />

            <div className="mt-4 flex flex-wrap items-start gap-4">
              {channel.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channel.logo || "/placeholder.svg"}
                  alt={`${channel.name} logo`}
                  crossOrigin="anonymous"
                  className="h-14 w-14 shrink-0 rounded-lg border border-border bg-card object-contain p-1.5"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-pretty text-xl font-bold sm:text-2xl">{channel.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
                    {channel.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    {channel.flag} {channel.countryName}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Streaming live. If playback fails, the source may be temporarily offline or geo-restricted. You can also{" "}
              <Link href="/watch" className="text-primary underline-offset-2 hover:underline">
                paste your own stream link
              </Link>
              .
            </p>
          </div>

          {/* Related */}
          <aside className="min-w-0">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              More like this
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
              {related.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
