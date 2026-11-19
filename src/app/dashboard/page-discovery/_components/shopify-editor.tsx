"use client"

/**
 * Shopify pieces of the content editor: extra fields (product title, URL
 * handle, image alt text), the "Publish to Shopify" flow (confirm with a diff,
 * conflict handling), and the publish history with undo.
 */

import { AlertTriangle, ExternalLink, History, Loader2, RotateCcw, ShoppingBag, UploadCloud } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { usePublishShopify, useRevertShopify, useShopifyHistory } from "@/hooks/api/use-shopify"
import { ApiError, errorMessage } from "@/lib/api/client"
import type {
  ShopifyConflictBody,
  ShopifyEditorFields,
  ShopifyPublishInput,
  ShopifyPublishResult,
} from "@/lib/api/shopify"
import { cn } from "@/lib/utils"

/** The editor's current draft, as the Shopify section needs it. */
export interface ShopifyDraft {
  productTitle: string
  seoTitle: string
  seoDescription: string
  handle: string
  bodyHtml: string
  bodyEdited: boolean
  alts: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  title: "Product title",
  seo_title: "SEO title",
  seo_description: "Meta description",
  handle: "URL handle",
  body_html: "Content",
  image_alts: "Image alt text",
}

/** Only what differs from Shopify's current values (so nothing is rewritten needlessly). */
export function draftChanges(base: ShopifyEditorFields, d: ShopifyDraft): ShopifyPublishInput {
  const out: ShopifyPublishInput = {}
  const effectiveTitle = base.seo_title || base.title
  if (d.productTitle.trim() && d.productTitle.trim() !== base.title) out.title = d.productTitle.trim()
  if (d.seoTitle.trim() !== effectiveTitle.trim()) out.seo_title = d.seoTitle.trim()
  if (d.seoDescription.trim() !== base.seo_description.trim()) out.seo_description = d.seoDescription.trim()
  if (d.handle.trim() && d.handle.trim() !== base.handle) out.handle = d.handle.trim()
  if (d.bodyEdited) out.body_html = d.bodyHtml
  const alts: Record<string, string> = {}
  for (const img of base.images) {
    const next = (d.alts[img.id] ?? "").trim()
    if (next && next !== img.alt) alts[img.id] = next
  }
  if (Object.keys(alts).length) out.image_alts = alts
  return out
}

export function changeCount(c: ShopifyPublishInput): number {
  return Object.keys(c).filter((k) => k !== "expected_updated_at" && k !== "force").length
}

/** Product title + URL handle + image alt fields (shown above the editor). */
export function ShopifyFields({
  base, productTitle, onProductTitle, handle, onHandle, alts, onAlt, disabled,
}: {
  base: ShopifyEditorFields
  productTitle: string
  onProductTitle: (v: string) => void
  handle: string
  onHandle: (v: string) => void
  alts: Record<string, string>
  onAlt: (id: string, v: string) => void
  disabled: boolean
}) {
  const handleChanged = handle.trim() && handle.trim() !== base.handle
  const prefix = base.external_type === "page" ? "/pages/" : "/products/"
  return (
    <div className="space-y-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <ShoppingBag className="size-4 text-emerald-600 dark:text-emerald-400" />
          Shopify {base.external_type === "page" ? "page" : "product"}
          {!base.published && (
            <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              Not published on the store
            </span>
          )}
        </p>
        {base.admin_url && (
          <a href={base.admin_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
            Open in Shopify admin <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{base.external_type === "page" ? "Page title" : "Product title"}</span>
          <Input value={productTitle} onValueChange={onProductTitle} maxLength={255} disabled={disabled} />
          <span className="block text-xs text-muted-foreground">The name shown on the page itself.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">URL handle</span>
          <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-ring dark:bg-input/30">
            <span className="pl-3 text-xs text-muted-foreground">{prefix}</span>
            <input value={handle} onChange={(e) => onHandle(e.target.value)} maxLength={255} disabled={disabled}
              className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none" aria-label="URL handle" />
          </div>
          <span className={cn("block text-xs", handleChanged ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
            {handleChanged
              ? `Changes the URL. We'll add a 301 redirect from ${prefix}${base.handle} so rankings and links carry over.`
              : "Lowercase words separated by hyphens."}
          </span>
        </label>
      </div>
      {base.images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Image alt text</p>
          <div className="space-y-2">
            {base.images.map((img) => {
              const value = alts[img.id] ?? ""
              return (
                <div key={img.id} className="flex items-center gap-3">
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="size-10 shrink-0 rounded-md border border-border object-cover" />
                  ) : (
                    <span className="size-10 shrink-0 rounded-md border border-border bg-muted" />
                  )}
                  <Input value={value} onValueChange={(v) => onAlt(img.id, v)} maxLength={512} disabled={disabled}
                    placeholder="Describe the image for search engines and screen readers"
                    aria-label="Image alt text" className={cn(!value && "border-amber-500/50")} />
                </div>
              )
            })}
          </div>
          {base.images.some((img) => !(alts[img.id] ?? "").trim()) && (
            <p className="text-xs text-amber-700 dark:text-amber-400">Images without alt text miss image-search traffic.</p>
          )}
        </div>
      )}
    </div>
  )
}

/** "Publish to Shopify" button + confirm (diff) + conflict dialog. */
export function ShopifyPublishBar({
  wid, did, pageId, base, draft, canManage, onPublished, onLoadLatest,
}: {
  wid: string
  did: string
  pageId: string
  base: ShopifyEditorFields
  draft: ShopifyDraft
  canManage: boolean
  onPublished: (result: ShopifyPublishResult) => void
  /** Discard the draft and reload Shopify's current version. */
  onLoadLatest: () => void
}) {
  const publish = usePublishShopify(wid, did, pageId)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [conflict, setConflict] = React.useState<ShopifyEditorFields | null>(null)
  const changes = draftChanges(base, draft)
  const count = changeCount(changes)

  async function send(force: boolean) {
    try {
      const result = await publish.mutateAsync({ ...changes, expected_updated_at: base.updated_at, force })
      if (result.status === "unchanged") {
        toast.info("Nothing to publish — Shopify already has these values.")
      } else {
        toast.success("Published to Shopify", {
          description: `${result.changed.map((c) => FIELD_LABELS[c] ?? c).join(", ")} updated.${result.redirect_created ? " A 301 redirect was added from the old URL." : ""}`,
        })
      }
      for (const w of result.warnings) toast.warning(w)
      onPublished(result)
    } catch (err) {
      const body = err instanceof ApiError && err.status === 409 ? (err.body as ShopifyConflictBody | undefined) : undefined
      if (body?.code === "shopify_conflict") {
        setConflict(body.current)
        return
      }
      throw new Error(errorMessage(err, "Could not publish to Shopify."))
    }
  }

  if (!canManage) {
    return (
      <p className="text-xs text-muted-foreground">
        Only workspace owners and admins can publish to Shopify.
      </p>
    )
  }

  return (
    <>
      <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={count === 0 || publish.isPending}
        title={count === 0 ? "No changes to publish" : undefined}>
        {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        Publish to Shopify{count > 0 ? ` (${count})` : ""}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="default"
        icon={<ShoppingBag className="size-5" />}
        title="Publish these changes to your store?"
        description="They go live on Shopify immediately. You can undo from the publish history."
        className="sm:max-w-lg"
        confirmLabel="Publish"
        details={<ChangeList base={base} changes={changes} />}
        onConfirm={() => send(false)}
      />

      <ConfirmDialog
        open={conflict !== null}
        onOpenChange={(o) => { if (!o) setConflict(null) }}
        tone="destructive"
        title="This item changed in Shopify"
        description="Someone edited it in Shopify after you opened it. Publishing now replaces their changes for the fields you edited."
        className="sm:max-w-lg"
        confirmLabel="Overwrite with my version"
        cancelLabel="Cancel"
        details={
          <div className="space-y-3">
            {conflict && <ConflictList base={base} current={conflict} />}
            <Button variant="outline" size="sm" onClick={() => { setConflict(null); onLoadLatest() }}>
              <RotateCcw className="size-4" /> Discard my edits and load Shopify&apos;s version
            </Button>
          </div>
        }
        onConfirm={async () => { await send(true); setConflict(null) }}
      />
    </>
  )
}

function shorten(v: unknown): string {
  const s = String(v ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return s ? (s.length > 90 ? `${s.slice(0, 90)}…` : s) : "(empty)"
}

function ChangeList({ base, changes }: { base: ShopifyEditorFields; changes: ShopifyPublishInput }) {
  const rows: { label: string; before: string; after: string }[] = []
  if (changes.title !== undefined) rows.push({ label: FIELD_LABELS.title, before: base.title, after: changes.title })
  if (changes.seo_title !== undefined)
    rows.push({ label: FIELD_LABELS.seo_title, before: base.seo_title || `${base.title} (default)`, after: changes.seo_title || "(use the title)" })
  if (changes.seo_description !== undefined)
    rows.push({ label: FIELD_LABELS.seo_description, before: base.seo_description, after: changes.seo_description })
  if (changes.handle !== undefined) rows.push({ label: FIELD_LABELS.handle, before: base.handle, after: changes.handle })
  if (changes.body_html !== undefined) rows.push({ label: FIELD_LABELS.body_html, before: base.body_html, after: changes.body_html })
  const altCount = Object.keys(changes.image_alts ?? {}).length
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="rounded-lg border border-border px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{r.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground line-through">{shorten(r.before)}</p>
          <p className="text-sm">{shorten(r.after)}</p>
        </li>
      ))}
      {altCount > 0 && (
        <li className="rounded-lg border border-border px-3 py-2 text-sm">
          Alt text for {altCount} image{altCount > 1 ? "s" : ""}
        </li>
      )}
      {changes.handle !== undefined && (
        <li className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> The URL changes; a 301 redirect is added from the old one.
        </li>
      )}
    </ul>
  )
}

function ConflictList({ base, current }: { base: ShopifyEditorFields; current: ShopifyEditorFields }) {
  const keys = ["title", "seo_title", "seo_description", "handle", "body_html"] as const
  const changed = keys.filter((k) => (base[k] ?? "") !== (current[k] ?? ""))
  if (!changed.length) return <p className="text-xs text-muted-foreground">Other settings changed in Shopify.</p>
  return (
    <ul className="space-y-1.5">
      {changed.map((k) => (
        <li key={k} className="text-xs">
          <span className="font-medium">{FIELD_LABELS[k]}</span> is now: <span className="text-muted-foreground">{shorten(current[k])}</span>
        </li>
      ))}
    </ul>
  )
}

/** Publish history with undo. */
export function ShopifyHistory({
  wid, did, pageId, canManage, onReverted,
}: {
  wid: string
  did: string
  pageId: string
  canManage: boolean
  onReverted: (result: ShopifyPublishResult) => void
}) {
  const history = useShopifyHistory(wid, did, pageId, true)
  const revert = useRevertShopify(wid, did, pageId)
  const [target, setTarget] = React.useState<string | null>(null)
  const rows = history.data ?? []
  const lastOk = rows.find((r) => r.status === "ok")

  return (
    <Card className="mt-5">
      <CardContent className="pt-6">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
          <History className="size-4 text-muted-foreground" /> Publish history
        </h3>
        {history.isPending ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing published from here yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {r.action === "revert" ? "Undo" : "Publish"}
                    {r.status === "ok" ? "" : r.status === "conflict" ? " · blocked (changed in Shopify)" : " · failed"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.user_email ? ` · ${r.user_email}` : ""}
                  </p>
                  {r.status === "ok" && r.changed.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {r.changed.map((c) => FIELD_LABELS[c] ?? c).join(", ")}
                    </p>
                  )}
                  {r.status === "error" && r.error && <p className="truncate text-xs text-destructive">{r.error}</p>}
                </div>
                {canManage && r.status === "ok" && r.id === lastOk?.id && (
                  <Button size="xs" variant="outline" onClick={() => setTarget(r.id)} disabled={revert.isPending}>
                    <RotateCcw /> Undo
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => { if (!o) setTarget(null) }}
        title="Undo this publish?"
        description="Shopify gets back the values it had before this publish. Your current edits in the editor are replaced."
        confirmLabel="Undo publish"
        onConfirm={async () => {
          try {
            const result = await revert.mutateAsync(target!)
            toast.success("Change undone in Shopify.")
            onReverted(result)
          } catch (err) {
            throw new Error(errorMessage(err, "Could not undo."))
          }
        }}
      />
    </Card>
  )
}
