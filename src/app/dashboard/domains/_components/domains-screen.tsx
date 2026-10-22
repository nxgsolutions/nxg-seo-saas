"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Gauge, Globe, Loader2, Plus, Settings2, Tag, Trash2 } from "lucide-react"
import * as React from "react"
import type { Domain } from "@/lib/api/workspaces"
import { DeleteDomainDialog } from "./delete-domain-dialog"
import { EditDomainDialog } from "./edit-domain-dialog"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useCategories } from "@/hooks/api/use-categories"
import { useDomainsScreen } from "../_hooks/use-domains-screen"

/** Industry-category chip. Shows the detected category, or a "Detecting…" state
 * while the background auto-detection resolves for a freshly added domain. */
function CategoryChip({ categoryId, detecting, nameOf }: {
  categoryId: string | null
  detecting: boolean
  nameOf: (id: string) => string | undefined
}) {
  if (categoryId) {
    const name = nameOf(categoryId)
    if (!name) return null
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-px text-xs font-medium text-muted-foreground">
        <Tag className="size-3" /> {name}
      </span>
    )
  }
  if (detecting) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-px text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Detecting category…
      </span>
    )
  }
  // No category and nothing being detected: show it as "Uncategorized" (null is
  // the uncategorized state) rather than a blank space, so the domain always
  // reads a definite category. Auto-detect, when it resolves, replaces this.
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-px text-xs font-medium text-muted-foreground">
      <Tag className="size-3" /> Uncategorized
    </span>
  )
}

export default function DomainsPage() {
  const { activeWorkspace, activeDomain, setActiveDomainId, canDelete, domains, loading, newSite, setNewSite, adding, error, setError, addDomain, detecting } = useDomainsScreen()
  const { data: categories = [] } = useCategories()
  const nameOf = React.useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name,
    [categories],
  )

  const [deleting, setDeleting] = React.useState<Domain | null>(null)
  const [editing, setEditing] = React.useState<Domain | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader title={<> Domains </>} description={<> Sites tracked in {activeWorkspace?.name ?? "this workspace"}. </>} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a domain</CardTitle>
          <CardDescription>Enter a domain or full URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addDomain} className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={newSite}
                  onValueChange={(v) => {
                    setNewSite(v)
                    if (error) setError(null)
                  }}
                  placeholder="example.com"
                  disabled={adding}
                  aria-invalid={!!error}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={adding} className="sm:w-32">
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" /> Add domain
                  </>
                )}
              </Button>
            </div>
            <AnimatePresence initial={false}>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-destructive"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All domains{domains.length ? ` (${domains.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : domains.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">
              No domains yet. Add your first above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {domains.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 px-6 py-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Globe className="size-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{w.name}</span>
                        {w.id === activeDomain?.id && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-px text-xs font-medium text-primary">Current</span>
                        )}
                        <CategoryChip categoryId={w.category_id} detecting={detecting.includes(w.id)} nameOf={nameOf} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {w.domain}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {w.id !== activeDomain?.id && (
                      <Button variant="ghost" size="sm" onClick={() => setActiveDomainId(w.id)} title="Work on this domain across the dashboard">
                        Open <ArrowRight className="size-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditing(w)}
                      title={`Market & niche settings for ${w.domain}`}>
                      <Settings2 className="size-4" /> Settings
                    </Button>
                    <Button
                      render={
                        <Link
                          href={`/dashboard/page-audit?url=${encodeURIComponent(w.domain)}`}
                        />
                      }
                      variant="outline"
                      size="sm"
                    >
                      <Gauge className="size-4" /> Audit
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(w)}
                        aria-label={`Delete ${w.domain}`} title={`Delete ${w.domain}`}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 />
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EditDomainDialog domain={editing} onOpenChange={(o) => { if (!o) setEditing(null) }} />
      <DeleteDomainDialog domain={deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }} />
    </div>
  )
}
