"use client"

/**
 * Business Profile — the details the AI extracts from your site in the first
 * pass of competitor discovery (what you do, your industry, services, audience
 * and market). Shown above the competitor list so the user can see the context
 * the competitors were matched against. The "Refresh" action re-runs ONLY the
 * business extraction (re-scrapes the site) and leaves the competitor list as
 * is. Renders nothing until a profile exists (i.e. discovery has run once).
 */

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useBusinessProfile,
  useRefreshBusinessProfile,
} from "@/hooks/api/use-competitors"
import { errorMessage } from "@/lib/api/client"
import {
  Briefcase,
  Building2,
  ChevronDown,
  Globe,
  Layers,
  Loader2,
  Package,
  Sparkles,
  Tag,
  Users,
  Wrench,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function BusinessProfilePanel({
  domainId,
  discovering = false,
}: {
  domainId: string
  /** A competitor-discovery run is in flight — show a loading state so the user
   *  sees the profile is being (re)built rather than a frozen or empty card. */
  discovering?: boolean
}) {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const query = useBusinessProfile(workspaceId, domainId || null)
  const refresh = useRefreshBusinessProfile(workspaceId, domainId || null)
  const profile = query.data?.profile

  // Collapsed by default: this is the Competitor Analysis page, so the competitor
  // list is the focus. The profile is secondary context the user can expand.
  // Auto-open while a discovery run is in flight so its progress is visible.
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (discovering) setOpen(true)
  }, [discovering])

  // First discovery run (or no profile yet): instead of rendering nothing, show a
  // skeleton so the user gets immediate feedback that the run is working.
  if (!profile) {
    return discovering ? <BusinessProfileLoading /> : null
  }

  const primaryProducts = (profile.primary_products ?? []).filter(Boolean)
  const secondaryProducts = (profile.secondary_products ?? []).filter(Boolean)
  // Back-compat: older profiles only have `products`.
  const products = (profile.products ?? []).filter(Boolean)
  const primary = primaryProducts.length ? primaryProducts : products
  const services = (profile.services ?? []).filter(Boolean)
  const specialties = profile.specialties?.trim() || null
  const price = profile.price_positioning?.trim() || null
  const typeLabel = businessTypeLabel(profile.business_type)
  const updated = formatUpdated(query.data?.extracted_at ?? null)
  const error = refresh.isError
    ? errorMessage(refresh.error, "Couldn't refresh the profile.")
    : null

  return (
    <Card className="gap-0 overflow-hidden p-0" aria-busy={discovering}>
      {/* Thin progress bar across the top while a run is in flight. */}
      {discovering ? (
        <div className="h-0.5 w-full overflow-hidden bg-primary/15">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      ) : null}
      {/* Header band — click to expand/collapse. Collapsed by default so the
          competitor list below is the first thing seen on this page. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-start justify-between gap-3 border-b bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent px-6 py-5 text-left transition-colors hover:bg-primary/[0.06]"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold leading-tight">
              Your business profile
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              What we understand about your site — the context your competitors
              are matched against.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {discovering ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Loader2 className="size-3.5 animate-spin" /> Updating…
            </span>
          ) : updated ? (
            <span className="text-xs text-muted-foreground">
              Updated {updated}
            </span>
          ) : null}
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open ? (
      <CardContent
        className={`space-y-5 px-6 py-5 transition-opacity ${discovering ? "opacity-60" : ""}`}
      >
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {profile.business_description ? (
          <p className="text-sm leading-relaxed text-foreground">
            {profile.business_description}
          </p>
        ) : null}

        {/* Facts grid — each fact is a self-contained bordered tile with
            transparent gaps, so an odd fact count leaves no gray empty cell. */}
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.industry ? (
            <Fact icon={<Building2 className="size-4" />} label="Business model">
              <span className="inline-flex flex-wrap items-center gap-2">
                {profile.industry}
                {typeLabel ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {typeLabel}
                  </span>
                ) : null}
              </span>
            </Fact>
          ) : null}
          {profile.sector ? (
            <Fact icon={<Layers className="size-4" />} label="Sector">
              {profile.sector}
            </Fact>
          ) : null}
          {profile.market ? (
            <Fact icon={<Globe className="size-4" />} label="Market">
              {profile.market}
            </Fact>
          ) : null}
          {price ? (
            <Fact icon={<Tag className="size-4" />} label="Price positioning">
              {price}
            </Fact>
          ) : null}
          {specialties ? (
            <Fact icon={<Sparkles className="size-4" />} label="Specialty">
              {specialties}
            </Fact>
          ) : null}
          {profile.target_audience ? (
            <Fact
              icon={<Users className="size-4" />}
              label="Target audience"
              className="sm:col-span-2"
            >
              {profile.target_audience}
            </Fact>
          ) : null}
        </div>

        {primary.length ? (
          <OfferingList
            icon={<Package className="size-3.5" />}
            title="Primary products"
            items={primary}
          />
        ) : null}

        {secondaryProducts.length ? (
          <OfferingList
            icon={<Package className="size-3.5" />}
            title="Secondary products"
            items={secondaryProducts}
          />
        ) : null}

        {services.length ? (
          <OfferingList
            icon={<Wrench className="size-3.5" />}
            title="Services & features"
            items={services}
          />
        ) : null}

        {!products.length && !services.length ? (
          <p className="text-sm text-muted-foreground">
            No products or services were extracted from the site yet.
          </p>
        ) : null}
      </CardContent>
      ) : null}
    </Card>
  )
}

/**
 * Loading state shown in place of the profile card during the FIRST discovery
 * run (before any profile exists). Mirrors the real card's header band so the
 * swap-in is seamless, with a skeleton body and an "Analyzing your site…" note
 * so the user knows the run is working.
 */
function BusinessProfileLoading() {
  return (
    <Card className="gap-0 overflow-hidden p-0" aria-busy>
      <div className="h-0.5 w-full overflow-hidden bg-primary/15">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold leading-tight">
              Your business profile
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Analyzing your site to understand what you do — this powers the
              competitor match.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Loader2 className="size-3.5 animate-spin" /> Analyzing…
        </span>
      </div>
      <CardContent className="space-y-5 px-6 py-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border bg-card p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function businessTypeLabel(type: string | null | undefined): string | null {
  switch ((type ?? "").toLowerCase()) {
    case "products":
      return "Products"
    case "services":
      return "Services"
    case "both":
      return "Products & services"
    default:
      return null
  }
}

function OfferingList({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: string[]
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </div>
      <ul className="grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground/60 sm:grid-cols-2">
        {items.map((s, i) => (
          <li key={`${s}-${i}`}>{s}</li>
        ))}
      </ul>
    </div>
  )
}

function Fact({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${className ?? ""}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        {label}
      </div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  )
}
