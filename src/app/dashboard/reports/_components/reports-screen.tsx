"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadSiteReport, printSiteReport } from "@/lib/report/site-report"
import { cn } from "@/lib/utils"
import { AlertTriangle, Download, FileBarChart, Loader2, Printer } from "lucide-react"
import { motion } from "motion/react"
import { useReportsScreen } from "../_hooks/use-reports-screen"
import { NoDomain } from "@/components/dashboard/current-domain"

export default function ReportsPage() {
  const { domain, building, error, data, generate } = useReportsScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <FileBarChart className="size-5 text-primary" /> Reports </>} description={<> Generate a client-ready SEO report combining the latest page audit with
        search performance — download as HTML or print to PDF. </>} />

      {!domain ? <NoDomain what="reports" /> : null}

      <Card className={domain ? undefined : "hidden"}>
        <CardHeader>
          <CardTitle className="text-base">Build a report</CardTitle>
          <CardDescription>One report for the domain selected at the top of the page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generate} disabled={building || !domain} size="lg" className="w-full sm:w-44">
            {building ? <><Loader2 className="size-4 animate-spin" /> Building…</> : <><FileBarChart className="size-4" /> Generate</>}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Report failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {data ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report ready — {data.domain}</CardTitle>
              <CardDescription>Here&apos;s what it includes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", data.audit ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                  {data.audit
                    ? `Page audit — score ${data.audit.score}/100`
                    : "Page audit — none found (run a Page Audit to include it)"}
                </li>
                <li className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", data.gsc ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                  {data.gsc
                    ? `Search performance — ${data.gsc.keyword_count.toLocaleString()} keywords, ${Math.round(data.gsc.total_clicks).toLocaleString()} clicks`
                    : "Search performance — not included (connect your search data to add it)"}
                </li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => printSiteReport(data)}>
                  <Printer className="size-4" /> Print / Save as PDF
                </Button>
                <Button variant="outline" onClick={() => downloadSiteReport(data)}>
                  <Download className="size-4" /> Download HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : !building ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileBarChart className="size-6" />
            </div>
            <p className="text-sm font-medium">Generate a client-ready report</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Pick a domain and click Generate to build a combined audit + search
              performance report you can download or print to PDF.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
