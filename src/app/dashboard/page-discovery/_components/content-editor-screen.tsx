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
import {
  useContentScore,
  usePageContent,
  useRefetchPageContent,
} from "@/hooks/api/use-page-discovery"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
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
  RefreshCw,
  Target,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { cleanEditorHtml } from "../_lib/editor-html"

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

function BackLink() {
  return (
    <Link
      href={BACK_HREF}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
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
  const contentQuery = usePageContent(wid, did, pageId)
  const refetch = useRefetchPageContent(wid, did, pageId)
  const content = contentQuery.data ?? null

  const [title, setTitle] = React.useState("")
  const [meta, setMeta] = React.useState("")
  const [keyword, setKeyword] = React.useState("")
  const [bodyHtml, setBodyHtml] = React.useState("")
  // Frozen HTML used to seed the rich-text editor on mount. Kept separate from
  // the live `bodyHtml` so it only changes when a page is (re-)fetched — passing
  // an ever-changing value to CKEditor would reset the caret on every keystroke.
  const [editorSeed, setEditorSeed] = React.useState("")
  const [url, setUrl] = React.useState("")

  // Seed the editable draft from fetched content once per fetch (setState during
  // render — the sanctioned "reset state when a prop changes" pattern). A live
  // re-fetch returns a new fetched_at, which re-seeds the fields and the editor.
  // cleanEditorHtml() strips presentational bold so the body doesn't open
  // entirely bold; both the live draft and the editor seed start from it so the
  // score reflects exactly what's shown.
  const stamp = content && !content.error ? `${content.fetched_at ?? ""}|${content.url}` : null
  const [seeded, setSeeded] = React.useState<string | null>(null)
  if (stamp && stamp !== seeded) {
    const cleaned = cleanEditorHtml(content!.body_html)
    setSeeded(stamp)
    setTitle(content!.title)
    setMeta(content!.meta)
    setBodyHtml(cleaned)
    setEditorSeed(cleaned)
    setUrl(content!.url)
  }

  const loadError =
    content?.error ??
    (contentQuery.isError
      ? errorMessage(contentQuery.error, "Could not load this page's content.")
      : null)
  const cached = content?.cached ?? false

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

  return (
    // Desktop: a fixed-height dual-pane shell — the header stays put and each
    // column scrolls inside its own region, so the page itself never scrolls.
    // Height = viewport minus the sticky topbar (4rem) and the main padding
    // (4rem). On mobile it falls back to a normal stacked, page-scrolling flow.
    <div className="space-y-5 lg:flex lg:h-[calc(100dvh-8rem)] lg:flex-col lg:gap-5 lg:space-y-0 lg:overflow-hidden">
      {/* Breadcrumb + header */}
      <div className="space-y-4 lg:shrink-0">
        <BackLink />
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
            {url && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    href={`/dashboard/page-audit?url=${encodeURIComponent(url)}`}
                  />
                }
              >
                <FileSearch className="size-4" /> Full audit
              </Button>
            )}
            <CopyButton
              text={bodyHtml}
              label="Copy HTML"
              className="border border-border"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch.mutate()}
              disabled={refetch.isPending}
            >
              {refetch.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {cached ? "Refresh" : "Re-fetch"}
            </Button>
          </div>
        </div>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="size-8 text-amber-500" />
            <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
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
                  <Field
                    label="Page title"
                    hint={`${title.length} chars · aim 30–60`}
                    hintTone={lenTone(title.length, 30, 60)}
                  >
                    <Input
                      value={title}
                      onValueChange={setTitle}
                      placeholder="Page title"
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
                    <RichTextEditor
                      key={seeded ?? "unseeded"}
                      initialData={editorSeed}
                      onChange={setBodyHtml}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Edits here are a working draft for scoring — copy the HTML
                      into your CMS when you&apos;re happy with the score.
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
          </div>
        </div>
      )}
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

