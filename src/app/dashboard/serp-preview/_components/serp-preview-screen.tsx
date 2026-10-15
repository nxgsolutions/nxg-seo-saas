"use client"

import { LivePageLoader } from "@/components/dashboard/live-page-loader"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Monitor, ScanSearch, Smartphone } from "lucide-react"
import { useSerpPreviewScreen } from "../_hooks/use-serp-preview-screen"
import { Counter } from "./counter"

export default function SerpPreviewPage() {
  const { initialUrl, onLoaded, device, setDevice, title, setTitle, description, setDescription, url, setUrl, limit, titlePx, shownTitle, shownDesc, display } = useSerpPreviewScreen()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={<> Search Preview </>} description={<> See exactly how your page will look in Google — with live
          pixel-width truncation and character counts. </>} />
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-4" /> Desktop
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-4" /> Mobile
          </Button>
        </div>
      </div>

      <LivePageLoader onLoaded={onLoaded} initialUrl={initialUrl} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit snippet</CardTitle>
            <CardDescription>Load a page above, or type to preview changes live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="serp-title">Title tag</Label>
                <Counter label="chars" value={title.length} min={30} max={60} />
              </div>
              <Input
                id="serp-title"
                value={title}
                onValueChange={setTitle}
                placeholder="Your page title"
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {titlePx}px / {limit.titlePx}px{" "}
                {shownTitle.truncated ? "· will be truncated" : ""}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="serp-url">URL</Label>
              </div>
              <Input
                id="serp-url"
                value={url}
                onValueChange={setUrl}
                placeholder="https://example.com/page"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="serp-desc">Meta description</Label>
                <Counter label="chars" value={description.length} min={70} max={limit.descChars} />
              </div>
              <textarea
                id="serp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Your meta description"
                rows={4}
                className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview — a faithful Google surface (intentionally light, like the real SERP) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google preview</CardTitle>
            <CardDescription className="capitalize">{device} result</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-white p-4">
              <div
                className={cn(
                  "font-arial",
                  device === "mobile" ? "max-w-[380px]" : "max-w-[600px]"
                )}
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
                    <ScanSearch className="size-3.5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-[14px] text-[#202124]">{display.host}</div>
                    <div className="text-[12px] text-[#4d5156]">
                      {[display.host, ...display.crumbs].join(" › ")}
                    </div>
                  </div>
                </div>
                <div className="mt-1 cursor-pointer text-[20px] leading-[1.3] text-[#1a0dab] hover:underline">
                  {shownTitle.text || "Your page title will appear here"}
                </div>
                <div className="mt-1 text-[14px] leading-[1.4] text-[#4d5156]">
                  {shownDesc || "Your meta description preview will appear here — aim for 70–160 characters so it isn't cut off."}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Preview is an approximation of Google&apos;s desktop/mobile
              rendering. Actual results may vary.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
