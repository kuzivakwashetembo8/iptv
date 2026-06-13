import { ChannelBrowser } from "@/components/channel-browser"
import { SiteHeader } from "@/components/site-header"
import { getMeta } from "@/lib/data"
import { GlobeIcon, TvIcon } from "@/components/icons"

export default async function HomePage() {
  const meta = await getMeta()

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-transparent">
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live now
            </span>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              Stream the world&apos;s live TV, <span className="text-primary">all in one place</span>
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Browse thousands of free live channels from across the globe. Search, filter, and watch instantly in a
              4K-ready player with HLS and DASH support.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              <Stat icon={<TvIcon className="h-5 w-5" />} value={meta.total.toLocaleString()} label="Channels" />
              <Stat icon={<GlobeIcon className="h-5 w-5" />} value={String(meta.countries.length)} label="Countries" />
              <Stat
                icon={<span className="text-base font-bold text-primary">#</span>}
                value={String(meta.categories.length)}
                label="Categories"
              />
            </div>
          </div>
        </div>
      </section>

      <ChannelBrowser categories={meta.categories} countries={meta.countries} total={meta.total} />
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary">{icon}</span>
      <div>
        <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
