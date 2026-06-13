"use client"

import type { CategoryFacet, CountryFacet } from "@/lib/types"
import { GlobeIcon, GridIcon, XIcon } from "./icons"

interface FilterSidebarProps {
  categories: CategoryFacet[]
  countries: CountryFacet[]
  activeCategory: string
  activeCountry: string
  onCategoryChange: (c: string) => void
  onCountryChange: (c: string) => void
  open: boolean
  onClose: () => void
}

export function FilterSidebar({
  categories,
  countries,
  activeCategory,
  activeCountry,
  onCategoryChange,
  onCountryChange,
  open,
  onClose,
}: FilterSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          aria-label="Close filters"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-border bg-popover p-5 transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:bg-transparent ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="text-sm font-semibold">Filters</span>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-secondary">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <GridIcon className="h-4 w-4" />
            Categories
          </div>
          <div className="flex flex-col gap-1">
            <FilterButton label="All categories" active={activeCategory === ""} onClick={() => onCategoryChange("")} />
            {categories.map((c) => (
              <FilterButton
                key={c.name}
                label={c.name}
                count={c.count}
                active={activeCategory === c.name}
                onClick={() => onCategoryChange(c.name)}
                capitalize
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <GlobeIcon className="h-4 w-4" />
            Countries
          </div>
          <div className="flex flex-col gap-1">
            <FilterButton label="All countries" active={activeCountry === ""} onClick={() => onCountryChange("")} />
            {countries.map((c) => (
              <FilterButton
                key={c.code}
                label={`${c.flag} ${c.name}`}
                count={c.count}
                active={activeCountry === c.code}
                onClick={() => onCountryChange(c.code)}
              />
            ))}
          </div>
        </section>
      </aside>
    </>
  )
}

function FilterButton({
  label,
  count,
  active,
  onClick,
  capitalize,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  capitalize?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-primary/15 font-semibold text-primary"
          : "text-foreground/80 hover:bg-secondary hover:text-foreground"
      }`}
    >
      <span className={`truncate ${capitalize ? "capitalize" : ""}`}>{label}</span>
      {count !== undefined && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
      )}
    </button>
  )
}
