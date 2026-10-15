"use client"

import { LivePageLoader } from "@/components/dashboard/live-page-loader"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Code2, Copy, ImageIcon, Loader2, RotateCcw, Sparkles, Tags } from "lucide-react"
import { useMetaTagsScreen } from "../_hooks/use-meta-tags-screen"
import { Field } from "./field"

function crumbs(url: string): string {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).join(" › ")
  } catch {
    return ""
  }
}

export default function MetaTagsPage() {
  const s = useMetaTagsScreen()
  const { f, live, set, edited } = s
  const ready = live !== null
  const path = crumbs(f.url)

  return (
    <div className="space-y-6">
      <PageHeader title={<><Tags className="size-5 text-primary" /> Title &amp; Meta</>}
        description="Load a page to see its live title, description and social tags, improve them (with AI if you like), and copy the finished tags." />

      <LivePageLoader onLoaded={s.onLoaded} initialUrl={s.initialUrl} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Tags</CardTitle>
              <CardDescription>{ready ? "Live values from the page — edit any field." : "Load a page above to fill these from the live page."}</CardDescription>
            </div>
            {s.anyEdited && (
              <Button variant="ghost" size="sm" onClick={s.resetToLive} className="shrink-0 text-muted-foreground">
                <RotateCcw className="size-4" /> Reset to live
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="size-4 text-primary" /> Suggest a better title &amp; description</p>
              <Button size="sm" onClick={s.generate} disabled={s.aiRunning || !ready}>
                {s.aiRunning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Write with AI
              </Button>
              {s.aiError ? <p className="w-full text-xs text-destructive">{s.aiError}</p>
                : <p className="w-full text-xs text-muted-foreground">
                  {s.aiFilled ? "AI suggestion filled in — review it, or reset to the live values." : "Reads the loaded page and writes a title and description. Nothing is published."}
                </p>}
            </div>

            <Field id="mt-title" label="Title" value={f.title} onChange={set("title")} placeholder="Page title" range={[30, 60]} edited={edited("title")} disabled={!ready} />
            <Field id="mt-desc" label="Meta description" value={f.description} onChange={set("description")} placeholder="Meta description" textarea range={[120, 160]} edited={edited("description")} disabled={!ready} />
            <Field id="mt-url" label="Canonical URL" value={f.url} onChange={set("url")} placeholder="https://example.com/page" edited={edited("url")} disabled={!ready} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="mt-site" label="Site name" value={f.siteName} onChange={set("siteName")} placeholder="Your brand" edited={edited("siteName")} disabled={!ready} />
              <Field id="mt-tw" label="Twitter handle" value={f.twitter} onChange={set("twitter")} placeholder="@yourbrand" edited={edited("twitter")} disabled={!ready} />
            </div>
            <Field id="mt-img" label="Social image URL" value={f.image} onChange={set("image")} placeholder="https://example.com/og.png (1200×630)" edited={edited("image")} disabled={!ready} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google preview</CardTitle>
              <CardDescription>Roughly how the result looks in search.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Intentionally light, like the real results page. */}
              <div className="rounded-xl border border-border bg-white p-4" style={{ fontFamily: "Arial, sans-serif" }}>
                <p className="truncate text-[13px] text-[#4d5156]">{s.host}{path ? ` › ${path}` : ""}</p>
                <p className="mt-0.5 line-clamp-1 text-[19px] leading-snug text-[#1a0dab]">{f.title.trim() || "Your title"}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{f.description.trim() || "Your description will appear here."}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social preview</CardTitle>
              <CardDescription>How it looks when shared.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-[1.91/1] w-full bg-muted">
                  {f.image.trim() && !s.imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image.trim()} alt="Social preview" className="size-full object-cover" onError={() => s.setImgError(true)} />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <ImageIcon className="size-6" />
                      <span className="text-xs">{s.imgError ? "Image failed to load" : "No social image set"}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-border bg-card px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.host}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-semibold">{f.title.trim() || "Your title"}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.description.trim() || "Your description will appear here."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="flex items-center gap-2 text-base"><Code2 className="size-4" /> Tags to paste</CardTitle>
              <Button variant="outline" size="sm" onClick={s.copy} disabled={!ready}>
                {s.copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy</>}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
                <code>{ready ? s.code : "Load a page to generate its tags."}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
