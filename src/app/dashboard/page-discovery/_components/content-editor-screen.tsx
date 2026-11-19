"use client"

import { ChecklistPanel } from "@/app/dashboard/content-optimization/_components/checklist-panel"
import { CopyButton } from "@/app/dashboard/content-optimization/_components/copy-button"
import { ScoreGauge } from "@/app/dashboard/page-audit/_components/score-gauge"
import { NoDomain } from "@/components/dashboard/current-domain"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  useContentScore,
  usePageContent,
  useRefetchPageContent,
  useSavePageContent,
} from "@/hooks/api/use-page-discovery"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useShopifyEditor } from "@/hooks/api/use-shopify"
import type { ShopifyEditorFields, ShopifyPublishResult } from "@/lib/api/shopify"
import { errorMessage } from "@/lib/api/client"
import type { ContentCheck } from "@/lib/api/page-discovery"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowLeft,
  DownloadCloud,
  ExternalLink,
  FileSearch,
  Loader2,
  Save,
  Target,
  X,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { cleanEditorHtml } from "../_lib/editor-html"
import { ShopifyFields, ShopifyHistory, ShopifyPublishBar } from "./shopify-editor"

/** Keys that change editor content (arrow keys, Tab etc. don't). */
function isEditingKey(e: React.KeyboardEvent): boolean {
  return e.key.length === 1 || e.key === "Backspace" || e.key === "Delete" || e.key === "Enter"
}

// CKEditor touches the DOM at import time, so load it client-only (ssr: false),
// matching the project's lazy-chart pattern. A skeleton holds the layout while
// the editor chunk loads.
const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[34rem] w-full animate-pulse rounded-lg border border-border bg-muted/30" />
    ),
  },
)

const BACK_HREF = "/dashboard/page-discovery"

/** Full-page content editor: fetch a discovered page's main content, edit the
 * title / meta / body, and watch a live SEO score + checklist update as you work.
 * Replaces the old modal sheet — opened at /dashboard/page-discovery/edit?page=<id>. */
export default function ContentEditorScreen() {
  const params = useSearchParams()
  const pageId = params.get("page")
  const activeWorkspace = useActiveWorkspace()
  const activeDomain = useActiveDomain()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null

  if (!activeDomain) {
    return (
      <div className="space-y-6">
        <BackLink />
        <NoDomain what="the content editor" />
      </div>
    )
  }

  if (!pageId) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileSearch className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No page selected. Pick a page to edit from Page Discovery.
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={BACK_HREF} />}
            >
              Back to Page Discovery
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Editor key={pageId} pageId={pageId} wid={wid!} did={did!} />
}

function BackLink({ onNavigate }: { onNavigate?: () => void }) {
  const className =
    "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
  // In the editor, back navigation is intercepted so unsaved edits can be
  // confirmed first; elsewhere it's a plain link.
  if (onNavigate) {
    return (
      <button type="button" onClick={onNavigate} className={className}>
        <ArrowLeft className="size-4" /> Page Discovery
      </button>
    )
  }
  return (
    <Link href={BACK_HREF} className={className}>
      <ArrowLeft className="size-4" /> Page Discovery
    </Link>
  )
}

function Editor({
  pageId,
  wid,
  did,
}: {
  pageId: string
  wid: string
  did: string
}) {
  const router = useRouter()
  const contentQuery = usePageContent(wid, did, pageId)
  const refetch = useRefetchPageContent(wid, did, pageId)
  const save = useSavePageContent(wid, did, pageId)
  const content = contentQuery.data ?? null
  const workspace = useActiveWorkspace()
  const canManage = workspace?.role === "owner" || workspace?.role === "admin"

  // Shopify-linked page: load the live store values; publishing goes back to Shopify.
  const isShopify = content?.external_source === "shopify"
  const shopifyQuery = useShopifyEditor(wid, did, pageId, isShopify)
  const [shopifyBase, setShopifyBase] = React.useState<ShopifyEditorFields | null>(null)
  const [productTitle, setProductTitle] = React.useState("")
  const [handle, setHandle] = React.useState("")
  const [alts, setAlts] = React.useState<Record<string, string>>({})
  // Only send the body when the user actually edited it: the editor normalises
  // HTML, so an untouched body must never be written back over the store's.
  const [bodyEdited, setBodyEdited] = React.useState(false)
  const [shopifySeeded, setShopifySeeded] = React.useState<string | null>(null)

  const [title, setTitle] = React.useState("")
  const [meta, setMeta] = React.useState("")
  const [keyword, setKeyword] = React.useState("")
  const [bodyHtml, setBodyHtml] = React.useState("")
  // Frozen HTML used to seed the rich-text editor on mount. Kept separate from
  // the live `bodyHtml` so it only changes when a page is (re-)fetched — passing
  // an ever-changing value to CKEditor would reset the caret on every keystroke.
  const [editorSeed, setEditorSeed] = React.useState("")
  const [url, setUrl] = React.useState("")
  // The last-persisted (or last-seeded) values, to detect unsaved changes.
  const [savedSnapshot, setSavedSnapshot] = React.useState({
    title: "",
    meta: "",
    bodyHtml: "",
  })
  // Back navigation held pending the "discard unsaved changes?" dialog.
  const [confirmLeave, setConfirmLeave] = React.useState(false)

  // Seed the editable draft from fetched content once per fetch (setState during
  // render — the sanctioned "reset state when a prop changes" pattern). A live
  // re-fetch returns a new fetched_at, which re-seeds the fields and the editor.
  // cleanEditorHtml() strips presentational bold so the body doesn't open
  // entirely bold; both the live draft and the editor seed start from it so the
  // score reflects exactly what's shown.
  const stamp =
    content && !content.error
      ? `${content.fetched_at ?? ""}|${content.url}`
      : null
  const [seeded, setSeeded] = React.useState<string | null>(null)
  if (stamp && stamp !== seeded) {
    const cleaned = cleanEditorHtml(content!.body_html)
    setSeeded(stamp)
    setTitle(content!.title)
    setMeta(content!.meta)
    setBodyHtml(cleaned)
    setEditorSeed(cleaned)
    setUrl(content!.url)
    // Baseline for unsaved-changes detection = exactly what we just seeded.
    setSavedSnapshot({
      title: content!.title,
      meta: content!.meta,
      bodyHtml: cleaned,
    })
  }

  // Seed from Shopify's live values (after the cached content), once per load.
  const live = shopifyQuery.data ?? null
  const liveStamp = live ? `${live.updated_at ?? ""}|${live.handle}|${shopifyQuery.dataUpdatedAt}` : null
  if (live && liveStamp !== shopifySeeded) {
    const liveBody = cleanEditorHtml(live.body_html)
    setShopifySeeded(liveStamp)
    setShopifyBase(live)
    setProductTitle(live.title)
    setHandle(live.handle)
    setAlts(Object.fromEntries(live.images.map((img) => [img.id, img.alt])))
    setUrl(live.url)
    if (content?.edited) {
      // A saved draft wins over Shopify's values (the editor already holds it);
      // its body counts as an edit to publish when it differs from the store.
      setBodyEdited(cleanEditorHtml(content.body_html) !== liveBody)
    } else {
      const seoTitle = live.seo_title || live.title
      setTitle(seoTitle)
      setMeta(live.seo_description)
      setBodyHtml(liveBody)
      setEditorSeed(liveBody)
      setBodyEdited(false)
      setSavedSnapshot({ title: seoTitle, meta: live.seo_description, bodyHtml: liveBody })
    }
  }

  function onShopifyPublished(result: ShopifyPublishResult) {
    if (result.status !== "published") return
    setShopifyBase(result.item)
    setProductTitle(result.item.title)
    setHandle(result.item.handle)
    setUrl(result.item.url)
    setBodyEdited(false)
    // Published = persisted (the server also drops the saved draft): no unsaved changes.
    setSavedSnapshot({ title, meta, bodyHtml })
  }

  const shopifyError =
    isShopify && shopifyQuery.isError
      ? errorMessage(shopifyQuery.error, "Couldn't load the live values from Shopify.")
      : null

  const loadError =
    content?.error ??
    (contentQuery.isError
      ? errorMessage(contentQuery.error, "Could not load this page's content.")
      : null)

  // Debounced snapshot drives the score: the keyword rides the same debounce as
  // every other field, so nothing fires on each keystroke, and the previous
  // score + checklist stay on screen (keepPreviousData) while the next computes.
  const scoreKey = useDebouncedValue(
    `${title}\u0000${meta}\u0000${keyword}\u0000${bodyHtml}`,
    600,
  )
  const scoreQuery = useContentScore(
    wid,
    did,
    pageId,
    scoreKey,
    { title, meta, body_html: bodyHtml, keyword },
    Boolean(seeded) && !loadError,
  )
  const result = scoreQuery.data ?? null
  const scoring = scoreQuery.isFetching

  const score = result?.score ?? null
  const stats = [
    { label: "Words", value: result?.word_count },
    { label: "Headings", value: result?.headings },
    { label: "Internal links", value: result?.internal_links },
    { label: "Reading ease", value: result?.reading_ease ?? undefined },
  ]
  const initialLoading = contentQuery.isPending && !seeded

  // Unsaved-changes detection: compare live fields with the last saved/seeded state.
  const dirty =
    Boolean(seeded) &&
    (title !== savedSnapshot.title ||
      meta !== savedSnapshot.meta ||
      bodyHtml !== savedSnapshot.bodyHtml)
  const saving = save.isPending

  // Warn before leaving the tab/closing while there are unsaved edits.
  React.useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  function handleSave() {
    if (saving) return
    const text = bodyHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim()
    if (!title.trim()) {
      toast.error("Add a page title before saving.")
      return
    }
    if (!text) {
      toast.error("The content is empty — add some content before saving.")
      return
    }
    save.mutate(
      { title, meta, body_html: bodyHtml },
      {
        onSuccess: () => {
          // Stay in the editor; the live score + checklist keep reflecting the content.
          setSavedSnapshot({ title, meta, bodyHtml })
          toast.success("Changes saved")
        },
        onError: (err) =>
          toast.error(
            errorMessage(err, "Could not save changes. Please try again."),
          ),
      },
    )
  }

  // Leaving the editor; confirm first when there are unsaved edits.
  function handleLeave() {
    if (dirty) setConfirmLeave(true)
    else router.push(BACK_HREF)
  }

  return (
    // Desktop: a fixed-height dual-pane shell — the header stays put and each
    // column scrolls inside its own region, so the page itself never scrolls.
    // Height = viewport minus the sticky topbar (4rem) and the main padding
    // (4rem). On mobile it falls back to a normal stacked, page-scrolling flow.
    <div className="space-y-5 lg:flex lg:h-[calc(100dvh-8rem)] lg:flex-col lg:gap-5 lg:space-y-0 lg:overflow-hidden">
      {/* Breadcrumb + header */}
      <div className="space-y-4 lg:shrink-0">
        <BackLink onNavigate={handleLeave} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Content editor
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold sm:text-2xl">
              {initialLoading ? (
                <Skeleton className="h-7 w-72" />
              ) : (
                title || "Untitled page"
              )}
            </h1>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="truncate">{url}</span>
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              text={bodyHtml}
              label="Copy HTML"
              className="border border-border"
            />
            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                disabled={saving}
              >
                <X className="size-4" /> Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving || initialLoading}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save changes
            </Button>
            {isShopify && shopifyBase && (
              <ShopifyPublishBar
                wid={wid}
                did={did}
                pageId={pageId}
                base={shopifyBase}
                canManage={canManage}
                draft={{
                  productTitle,
                  seoTitle: title,
                  seoDescription: meta,
                  handle,
                  bodyHtml,
                  bodyEdited,
                  alts,
                }}
                onPublished={onShopifyPublished}
                onLoadLatest={() => void shopifyQuery.refetch()}
              />
            )}
          </div>
        </div>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="size-8 text-amber-500" />
            <p className="max-w-md text-sm text-muted-foreground">
              {loadError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch.mutate()}
              disabled={refetch.isPending}
            >
              <DownloadCloud className="size-4" /> Try fetching again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:overflow-hidden">
          {/* Editor column — its own independent scroll area on desktop */}
          <div className="scroll-smooth lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-width:thin]">
          <Card>
            <CardContent className="space-y-5 pt-6">
              {initialLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : (
                <>
                  {shopifyError && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      {shopifyError} You can still edit and score, but publishing is off until it loads.
                    </p>
                  )}
                  {isShopify && shopifyBase && (
                    <ShopifyFields
                      base={shopifyBase}
                      productTitle={productTitle}
                      onProductTitle={setProductTitle}
                      handle={handle}
                      onHandle={setHandle}
                      alts={alts}
                      onAlt={(id, v) => setAlts((a) => ({ ...a, [id]: v }))}
                      disabled={!canManage}
                    />
                  )}
                  <Field
                    label={isShopify ? "SEO title" : "Page title"}
                    hint={`${title.length} chars · aim 30–60`}
                    hintTone={lenTone(title.length, 30, 60)}
                  >
                    <Input
                      value={title}
                      onValueChange={setTitle}
                      placeholder={isShopify ? (productTitle || "SEO title") : "Page title"}
                      className="h-11 text-base"
                      maxLength={300}
                    />
                  </Field>
                  <Field
                    label="Meta description"
                    hint={`${meta.length} chars · aim 120–160`}
                    hintTone={lenTone(meta.length, 120, 160)}
                  >
                    <textarea
                      value={meta}
                      onChange={(e) => setMeta(e.target.value)}
                      rows={3}
                      maxLength={400}
                      placeholder="Meta description shown in search results"
                      className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                  </Field>

                  <Field label="Content" as="div">
                    <div
                      onKeyDownCapture={(e) => { if (isEditingKey(e)) setBodyEdited(true) }}
                      onPasteCapture={() => setBodyEdited(true)}
                      onCutCapture={() => setBodyEdited(true)}
                      onDropCapture={() => setBodyEdited(true)}
                      onClickCapture={(e) => {
                        if ((e.target as HTMLElement).closest("button")) setBodyEdited(true)
                      }}
                    >
                      <RichTextEditor
                        key={`${seeded ?? "unseeded"}|${shopifySeeded ?? ""}`}
                        initialData={editorSeed}
                        onChange={setBodyHtml}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isShopify
                        ? bodyEdited
                          ? "Content edited — it will be published with your other changes."
                          : "Edit the content, then publish to Shopify. Untouched content is never rewritten."
                        : "Save keeps your edits here; copy the HTML into your CMS to put them live."}
                    </p>
                  </Field>
                </>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Score sidebar — its own independent scroll area, so a long
              checklist never gets "stuck" and neither pane scrolls the page. */}
          <div className="scroll-smooth lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-width:thin]">
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-col items-center">
                  {score == null ? (
                    <Skeleton className="size-32 rounded-full" />
                  ) : (
                    <ScoreGauge score={score} />
                  )}
                  <p className="mt-2 flex h-4 items-center gap-1.5 text-xs text-muted-foreground">
                    {scoring ? (
                      <>
                        <Loader2 className="size-3 animate-spin" /> Updating
                        score…
                      </>
                    ) : (
                      "Live SEO content score"
                    )}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Target keyword
                  </label>
                  <div className="relative">
                    <Target
                      aria-hidden
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      value={keyword}
                      onValueChange={setKeyword}
                      placeholder="e.g. best running shoes"
                      className="h-10 pl-9"
                      maxLength={200}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Refines keyword checks — title, headings and density. The
                    score updates when you pause.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                    >
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-base font-semibold tabular-nums">
                        {s.value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-5">
              <CardContent className="pt-6">
                <h3 className="mb-3 text-sm font-semibold">Checklist</h3>
                {result ? (
                  <div
                    className={cn(
                      "transition-opacity",
                      scoring && "opacity-60",
                    )}
                  >
                    <ChecklistPanel
                      checks={result.checks as unknown as ContentCheck[]}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isShopify && shopifyBase && (
              <ShopifyHistory
                wid={wid}
                did={did}
                pageId={pageId}
                canManage={canManage}
                onReverted={() => void shopifyQuery.refetch()}
              />
            )}
          </div>
        </div>
      )}

      {/* Discard-unsaved-changes guard for leaving via Back/Cancel. */}
      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={(o) => {
          if (!o) setConfirmLeave(false)
        }}
        title="Discard unsaved changes?"
        description="You have unsaved edits on this page. If you leave now, they'll be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="destructive"
        onConfirm={() => {
          setConfirmLeave(false)
          router.push(BACK_HREF)
        }}
      />
    </div>
  )
}

/** Amber hint when a length is outside its recommended range. */
function lenTone(len: number, min: number, max: number): "muted" | "warn" {
  if (len === 0) return "muted"
  return len < min || len > max ? "warn" : "muted"
}

function Field({
  label,
  hint,
  hintTone = "muted",
  children,
  as = "label",
}: {
  label: string
  hint?: string
  hintTone?: "muted" | "warn"
  children: React.ReactNode
  // Use "div" when the field wraps a complex widget that contains its own
  // buttons (e.g. the CKEditor toolbar). A <label> forwards any click inside it
  // to its first labelable control, so a <label> here would make clicking the
  // editor body fire the first toolbar button (opening the heading dropdown).
  as?: "label" | "div"
}) {
  const Wrapper = as
  return (
    <Wrapper className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && (
          <span
            className={cn(
              "text-xs tabular-nums",
              hintTone === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </Wrapper>
  )
}
