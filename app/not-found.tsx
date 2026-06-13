import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { TvIcon } from "@/components/icons"

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:py-32">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <TvIcon className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-2 text-balance text-3xl font-bold sm:text-4xl">This channel isn&apos;t available</h1>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          The page or channel you&apos;re looking for may have moved, gone offline, or never existed. Head back to browse
          thousands of live channels.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse channels
        </Link>
      </main>
    </div>
  )
}
