"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { ListRowsSkeleton, PanelSkeleton } from "@/components/dashboard/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Bot,
  FileText,
  Loader2,
  Map as MapIcon,
  Search
} from "lucide-react"
import { motion } from "motion/react"
import { useRobotsScreen } from "../_hooks/use-robots-screen"
import { STATUS_META } from "../_lib/robots-helpers"
import { Stat } from "./stat"

export default function RobotsPage() {
  const { url, setUrl, running, error, setError, result, run } = useRobotsScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> Crawlability </>} description={<> Check whether search engines can crawl your site — inspect robots.txt
        directives and validate your XML sitemap. </>} />

      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onValueChange={(v) => {
              setUrl(v)
              if (error) setError(null)
            }}
            placeholder="example.com"
            disabled={running}
            className="h-10 pl-9"
            aria-invalid={!!error}
          />
        </div>
        <Button type="submit" size="lg" disabled={running} className="sm:w-32">
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Checking…
            </>
          ) : (
            <>
              <Bot className="size-4" /> Check
            </>
          )}
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Check failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {running && !result ? (
        <div className="space-y-4">
          <PanelSkeleton lines={2} />
          <ListRowsSkeleton rows={5} />
        </div>
      ) : result ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4" /> robots.txt
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <Stat label="Status" value={result.robots.found ? "Found" : "Not found"} />
                <Stat
                  label="Crawlable"
                  value={result.robots.blocks_all ? "Blocked site-wide" : "Yes"}
                />
                <Stat label="Disallow rules" value={`${result.robots.disallow_count}`} />
                <Stat label="Allow rules" value={`${result.robots.allow_count}`} />
                <Stat label="Sitemaps declared" value={`${result.robots.sitemaps.length}`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapIcon className="size-4" /> Sitemap
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <Stat label="Status" value={result.sitemap.found ? "Valid" : "Not found / invalid"} />
                <Stat
                  label="Type"
                  value={result.sitemap.type === "index" ? "Sitemap index" : result.sitemap.type === "urlset" ? "URL set" : "—"}
                />
                <Stat
                  label={result.sitemap.type === "index" ? "Sitemaps" : "URLs"}
                  value={`${result.sitemap.url_count}`}
                />
                <Stat label="URL" value={result.sitemap.url.replace(result.origin, "") || "/sitemap.xml"} mono />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crawlability checks</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {result.checks.map((check) => {
                const meta = STATUS_META[check.status]
                const Icon = meta.icon
                return (
                  <div key={check.id} className="flex items-start gap-3 p-4">
                    <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", meta.ring)}>
                      <Icon className={cn("size-4", meta.className)} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="text-sm text-muted-foreground">{check.detail}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-6" />
            </div>
            <p className="text-sm font-medium">Check your crawlability</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Enter a domain to inspect its robots.txt and sitemap.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
