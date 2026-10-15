"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Lightbulb,
  ListChecks,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react"
import { useContentOptimizationScreen } from "../_hooks/use-content-optimization-screen"
import { AnalyzeForm } from "./analyze-form"
import { ResultView } from "./result-view"
import { ScoreBreakdown, TopPagesCompare } from "./score-sidebar"
import { RunningState } from "./running-state"
import { SessionHistory } from "./session-history"

function EmptyState() {
  const items = [
    {
      icon: ListChecks,
      title: "Score & checklist",
      text: "A fixed-rule score out of 100 — the same page always gets the same score.",
    },
    {
      icon: Users,
      title: "Compare with top pages",
      text: "Length, structure and the terms the pages ranking for your keyword use.",
    },
    {
      icon: Sparkles,
      title: "AI writing",
      text: "Title and meta options, an outline with the missing sections and a new intro.",
    },
  ]
  return (
    <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wand2 className="size-6" />
        </div>
        <h2 className="mt-3 text-base font-semibold">
          Optimize a page for a keyword
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the page and the keyword it should rank for, then click Analyze
          content.
        </p>
      </div>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-4">
            <Icon className="size-5 text-primary" />
            <p className="mt-2 text-sm font-medium">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResultSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Loading run…</span>
      <div className="flex gap-5 rounded-2xl border bg-card p-5">
        <Skeleton className="size-36 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 pt-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-10 w-96 max-w-full rounded-2xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export default function ContentOptimizationPage() {
  const screen = useContentOptimizationScreen()
  const { running, runningUrl, session, sessionLoading, sessionError, rerun } =
    screen
  const showSidebarResult =
    !running && !sessionLoading && (session?.result.version ?? 0) >= 2

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <>
            <Wand2 className="size-5 text-primary" /> Content Optimization
          </>
        }
        description="Optimize a page for its target keyword and get clear, actionable recommendations to improve your rankings."
        help={<>
          <p><span className="font-medium text-foreground">Content Optimization</span> scores one page for a target keyword (out of 100, by fixed rules) and gives a clear checklist of what to change.</p>
          <p className="mt-2">It compares your page with the top-ranking pages and can draft AI <span className="font-medium text-foreground">title, meta and outline</span> suggestions.</p>
        </>}
        actions={
          <div className="hidden max-w-sm items-start gap-3 rounded-2xl border bg-card/70 p-4 lg:flex">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lightbulb className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Get better rankings</p>
              <p className="text-xs text-muted-foreground">
                See what top-ranking pages do better, fix what matters most, and
                get AI-written suggestions for your page.
              </p>
            </div>
          </div>
        }
      />

      <AnalyzeForm screen={screen} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          {running ? (
            <RunningState url={runningUrl} />
          ) : sessionLoading ? (
            <ResultSkeleton />
          ) : session ? (
            <ResultView
              key={session.id}
              session={session}
              onRerun={rerun}
              rerunning={running}
            />
          ) : sessionError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertTriangle className="size-4" /> This run could not be loaded.
              It may belong to another workspace.
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
        <aside className="min-w-0 space-y-4">
          {showSidebarResult && session && (
            <>
              <ScoreBreakdown result={session.result} />
              <TopPagesCompare result={session.result} />
            </>
          )}
          <SessionHistory screen={screen} />
        </aside>
      </div>
    </div>
  )
}
