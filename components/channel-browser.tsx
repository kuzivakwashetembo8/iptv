"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWRInfinite from "swr/infinite"
import type { CategoryFacet, Channel, ChannelsResponse, CountryFacet } from "@/lib/types"
import { ChannelCard } from "./channel-card"
import { FilterSidebar } from "./filter-sidebar"
import { AlertIcon, FilterIcon, LoaderIcon, SearchIcon, TvIcon, XIcon } from "./icons"

const PAGE_SIZE = 60

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ChannelsResponse>)

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface ChannelBrowserProps {
  categories: CategoryFacet[]
  countries: CountryFacet[]
  total: number
}

export function ChannelBrowser({ categories, countries, total }: ChannelBrowserProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [country, setCountry] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const debouncedSearch = useDebounced(search, 300)

  const getKey = useCallback(
    (pageIndex: number, previous: ChannelsResponse | null) => {
      if (previous && !previous.hasMore) return null
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(PAGE_SIZE),
      })
      if (debouncedSearch) params.set("q", debouncedSearch)
      if (category) params.set("category", category)
      if (country) params.set("country", country)
      return `/api/channels?${params.toString()}`
    },
    [debouncedSearch, category, country],
  )

  const { data, size, setSize, isLoading, isValidating, error } = useSWRInfinite<ChannelsResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  })

  const channels: Channel[] = useMemo(() => (data ? data.flatMap((p) => p.channels) : []), [data])
  const resultTotal = data?.[0]?.total ?? 0
  const hasMore = data ? data[data.length - 1]?.hasMore : false
  const isLoadingMore = isValidating && size > 1

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize((s) => s + 1)
        }
      },
      { rootMargin: "600px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isValidating, setSize])

  const hasActiveFilters = Boolean(category || country || search)

  function clearFilters() {
    setSearch("")
    setCategory("")
    setCountry("")
  }

  return (
    <div className="mx-auto flex max-w-[1600px] gap-6 px-4 sm:px-6">
      <FilterSidebar
        categories={categories}
        countries={countries}
        activeCategory={category}
        activeCountry={country}
        onCategoryChange={(c) => {
          setCategory(c)
          setSidebarOpen(false)
        }}
        onCountryChange={(c) => {
          setCountry(c)
          setSidebarOpen(false)
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1 py-6">
        {/* Search + controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search channels by name, category, or country..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:border-primary/50 lg:hidden"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Result meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading channels..."
            ) : (
              <>
                <span className="font-semibold text-foreground tabular-nums">{resultTotal.toLocaleString()}</span> of{" "}
                {total.toLocaleString()} channels
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              <XIcon className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
            <AlertIcon className="h-5 w-5 text-red-400" />
            Failed to load channels. Please try again.
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-video animate-pulse bg-secondary/60" />
                <div className="space-y-2 p-3">
                  <div className="h-3.5 w-4/5 animate-pulse rounded bg-secondary/60" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-secondary/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && channels.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/50 py-20 text-center">
            <TvIcon className="h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">No channels found</p>
            <p className="max-w-sm text-sm text-muted-foreground text-pretty">
              Try a different search term or clear your filters to browse all channels.
            </p>
          </div>
        )}

        {/* Grid */}
        {channels.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {channels.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        )}

        {/* Sentinel / load more */}
        <div ref={sentinelRef} className="h-10" />
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <LoaderIcon className="h-5 w-5 animate-spin" />
            Loading more channels...
          </div>
        )}
        {!hasMore && channels.length > 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">You&apos;ve reached the end.</p>
        )}
      </main>
    </div>
  )
}
