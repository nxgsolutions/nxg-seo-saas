"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { ScoreResultSkeleton } from "@/components/dashboard/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Globe,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { motion } from "motion/react"
import { useAiSearchScreen } from "../_hooks/use-ai-search-screen"
import { oppColor, priorityBadge, scoreColor } from "../_lib/ai-search-helpers"

export default function AiSearchPage() {
  const { query, setQuery, domain, setDomain, running, error, setError, result, run } = useAiSearchScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <Sparkles className="size-5 text-primary" /> AI Visibility </>} description={<> See how likely your brand is to appear in AI answers (ChatGPT, Perplexity,
        Google AI Overviews) for a topic — and how to improve it. </>} />

      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onValueChange={(v) => {
              setQuery(v)
              if (error) setError(null)
            }}
            placeholder="Topic or query, e.g. best seo audit tool"
            disabled={running}
            className="h-10 pl-9"
            aria-invalid={!!error}
          />
        </div>
        <div className="relative sm:w-64">
          <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={domain} onValueChange={setDomain} placeholder="Your domain (optional)" disabled={running} className="h-10 pl-9" />
        </div>
        <Button type="submit" size="lg" disabled={running} className="sm:w-36">
          {running ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><Sparkles className="size-4" /> Analyze</>}
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {running && !result ? (
        <ScoreResultSkeleton />
      ) : result ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center">
                <span className={cn("text-5xl font-semibold tabular-nums", scoreColor(result.visibility_score))}>
                  {result.visibility_score}
                </span>
                <span className="text-xs text-muted-foreground">AI visibility / 100</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">{result.summary}</p>
                {/* The score is the model's estimate — it does not query ChatGPT / Perplexity live. */}
                <p className="ds-meta flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  {/* result.model has the AI model name (not shown). */}
                  Estimated by AI — not a live check of AI answers.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-primary" /> Target AI queries
                </CardTitle>
                <CardDescription>Prompts users ask assistants where you could appear.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.target_queries.map((t, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{t.query}</span>
                    <span className={cn("shrink-0 text-xs font-semibold uppercase", oppColor(t.opportunity))}>{t.opportunity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="size-4 text-amber-500" /> Recommendations
                </CardTitle>
                <CardDescription>Prioritized actions to get cited more.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{r.title}</p>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", priorityBadge(r.priority))}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Content gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.content_gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                      <span className="text-muted-foreground">{g}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" /> Competitor notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.competitor_notes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <p className="text-sm font-medium">Analyze your AI-search visibility</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enter a topic and your domain to see how you show up in AI answers and
              what to improve.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
