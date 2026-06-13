import Link from "next/link"
import { LinkIcon, TvIcon } from "./icons"

export function SiteHeader() {
  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TvIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Stream<span className="text-primary">It</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/watch"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Paste a stream link</span>
            <span className="sm:hidden">Paste link</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
