"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CheckCircle2, Loader2 } from "lucide-react"
import * as React from "react"
import { hostOf } from "../_lib/content-optimization-helpers"

const STEPS = [
  { label: "Reading your page", after: 0 },
  { label: "Reading the top-ranking pages", after: 3 },
  { label: "Scoring and comparing", after: 9 },
  { label: "Writing suggestions with AI", after: 12 },
]

/** Progress while a run is in flight (steps advance on a timer — the run is one request). */
export function RunningState({ url }: { url: string }) {
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const current = STEPS.reduce((i, s, idx) => (elapsed >= s.after ? idx : i), 0)

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <section className="rounded-2xl border bg-card p-5 shadow-xs">
        <p className="text-sm font-semibold">Analyzing {hostOf(url)}</p>
        <p className="text-xs text-muted-foreground">Usually 15–40 seconds.</p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.label} className={cn("flex items-center gap-2 text-sm", i > current && "text-muted-foreground")}>
              {i < current ? <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                : i === current ? <Loader2 className="size-4 animate-spin text-primary" />
                : <span className="size-4 rounded-full border-2 border-muted" aria-hidden="true" />}
              {s.label}
            </li>
          ))}
        </ol>
      </section>
      <section className="flex gap-5 rounded-2xl border bg-card p-5" aria-hidden="true">
        <Skeleton className="size-36 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 pt-4">
          <Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-40 rounded-full" />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  )
}
