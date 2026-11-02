"use client"

/**
 * Competitor-discovery progress UI.
 *
 * `DiscoveryOverlay` is the public piece: a centered, blurred-backdrop modal that
 * shows the live, step-by-step run (each stage ticks off as the real backend job
 * reaches it), then a short success flourish before it fades out to reveal the
 * competitor list. Driven entirely by the real job (`discover.job.step`), so the
 * timeline mirrors the server, not a fake timer.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  Check,
  CheckCircle2,
  FileSearch,
  type LucideIcon,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import * as React from "react"

import type { useDiscoverCompetitors } from "@/hooks/api/use-competitors"

type Step = { icon: LucideIcon; title: string; desc: string }

// Must mirror backend DISCOVERY_STEPS (competitor_discovery_service.py) — 3 phases.
const STEPS: Step[] = [
  { icon: FileSearch, title: "Creating your business profile", desc: "Reading your site — products, services and niche" },
  { icon: Radar, title: "Finding competitors", desc: "Scanning the market for similar brands" },
  { icon: ShieldCheck, title: "Verifying your competitors", desc: "Checking each live site and matching what they sell" },
]

/**
 * Full-screen modal wrapper. Opens while a discovery run is in flight, shows a
 * success state for a beat when it finishes, then closes so the revealed
 * competitor list (already refetched by the hook) is what the user lands on.
 * On error it closes immediately and lets the inline error surface.
 */
export function DiscoveryOverlay({
  discover,
  domain,
}: {
  discover: ReturnType<typeof useDiscoverCompetitors>
  domain?: string
}) {
  const reduce = useReducedMotion()
  const { isRunning, isDone, job } = discover
  const [phase, setPhase] = React.useState<"hidden" | "running" | "success">("hidden")

  // Open as soon as a run begins.
  React.useEffect(() => {
    if (isRunning) setPhase("running")
  }, [isRunning])

  // Run finished: celebrate on success, otherwise close. Only transitions out of
  // the "running" phase (functional update), so it never re-opens a closed modal.
  React.useEffect(() => {
    if (isRunning) return
    setPhase((p) => (p === "running" ? (isDone ? "success" : "hidden") : p))
  }, [isRunning, isDone])

  // Auto-dismiss the success flourish. Kept in its OWN effect keyed on `phase`,
  // so entering "success" doesn't tear down and cancel its own hide timer.
  React.useEffect(() => {
    if (phase !== "success") return
    const t = window.setTimeout(() => setPhase("hidden"), 1800)
    return () => window.clearTimeout(t)
  }, [phase])

  // Lock background scroll while the modal is up.
  React.useEffect(() => {
    if (phase === "hidden") return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [phase])

  return (
    <AnimatePresence>
      {phase !== "hidden" ? (
        <motion.div
          key="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Finding your competitors"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Blurred, dimmed backdrop */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />

          <motion.div
            className="relative w-full max-w-lg"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <DiscoverySuccess
                  key="success"
                  count={job?.count ?? 0}
                  preview={job?.proposed != null}
                  reduce={!!reduce}
                />
              ) : (
                <DiscoveryProgress
                  key="progress"
                  step={job?.step ?? 0}
                  totalSteps={job?.total_steps ?? STEPS.length}
                  domain={domain}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** The live step list, styled as a modal card. Exported for standalone use. */
export function DiscoveryProgress({
  step = 0,
  totalSteps = STEPS.length,
  domain,
}: {
  step?: number
  totalSteps?: number
  domain?: string
}) {
  const reduce = useReducedMotion()
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    const start = Date.now()
    const id = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 250)
    return () => window.clearInterval(id)
  }, [])

  // step is 1-indexed from the server (0 while starting). Active row = step-1.
  const activeIndex = Math.min(STEPS.length - 1, Math.max(0, step - 1))
  // Fill to the middle of the current step. Floor at 8% so the very start shows a
  // tidy rounded nub (not a cropped sliver); cap at 92% so it never looks done
  // until the success state takes over.
  const pct = Math.max(8, Math.min(92, (Math.max(step, 0.4) - 0.5) / Math.max(totalSteps, 1) * 100))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border bg-card shadow-2xl"
    >
      <div className="p-6 sm:p-7">
        {/* Overall progress — a self-contained rounded pill INSIDE the card, so
            its ends never get clipped by the card's rounded corners. The fill
            grows smoothly with a sheen that travels across the filled portion. */}
        <div className="relative mb-6 h-2 w-full overflow-hidden rounded-full bg-primary/10">
          <motion.div
            className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ ease: "easeOut", duration: 0.6 }}
          >
            {!reduce ? (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                animate={{ x: ["0%", "420%"] }}
                transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
              />
            ) : null}
          </motion.div>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {!reduce ? (
                <motion.span
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                />
              ) : null}
              <Sparkles className="relative size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight">Finding your competitors</p>
              <p className="truncate text-sm text-muted-foreground">
                {domain ? <>Analyzing <span className="font-medium text-foreground">{domain}</span></> : "Analyzing your site"}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {Math.floor(elapsed)}s
          </span>
        </div>

        {/* Steps timeline */}
        <div className="space-y-1">
          {STEPS.map((s, i) => {
            const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo"
            return (
              <StepRow
                key={s.title}
                step={s}
                state={state}
                reduce={!!reduce}
                last={i === activeIndex}
                connector={i < STEPS.length - 1}
              />
            )
          })}
        </div>

        <p className="mt-5 border-t pt-4 text-center text-xs text-muted-foreground">
          This usually takes 1–2 minutes. Please keep this tab open.
        </p>
      </div>
    </motion.div>
  )
}

/** Success flourish shown for a beat once the run completes. In `preview` mode
 *  (find competitors again) the copy points to the confirm step that follows. */
function DiscoverySuccess({
  count,
  preview = false,
  reduce,
}: {
  count: number
  preview?: boolean
  reduce: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border bg-card shadow-2xl"
    >
      <div className="h-1.5 w-full bg-primary" />
      <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
        <div className="relative flex size-20 items-center justify-center">
          {!reduce ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20"
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ) : null}
          <motion.div
            className="relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            initial={reduce ? { scale: 1 } : { scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
          >
            <Check className="size-10" strokeWidth={3} />
          </motion.div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xl font-semibold">
            {count > 0
              ? preview
                ? `Found ${count} new ${count === 1 ? "competitor" : "competitors"}`
                : "Your competitors are ready"
              : "Analysis complete"}
          </p>
          <p className="text-sm text-muted-foreground">
            {count > 0
              ? preview
                ? <>Review {count === 1 ? "it" : "them"} to add to your list…</>
                : <>Found <span className="font-semibold text-foreground">{count}</span> direct {count === 1 ? "competitor" : "competitors"} — loading your list…</>
              : preview
                ? "No new competitors found — your list is up to date."
                : "Loading your results…"}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function StepRow({
  step,
  state,
  reduce,
  last,
  connector,
}: {
  step: Step
  state: "done" | "active" | "todo"
  reduce: boolean
  last: boolean
  connector: boolean
}) {
  const Icon = step.icon
  const active = state === "active"
  return (
    <div
      className={`relative flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors ${
        active ? "bg-primary/[0.06]" : ""
      }`}
    >
      {/* Breathing highlight on the step that's currently running. Sits behind
          the content (z-0) and pulses its opacity so the row feels "live". */}
      {active && !reduce ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-primary/10"
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        />
      ) : null}

      <div className="relative z-10 flex size-11 shrink-0 items-center justify-center">
        {/* Connector line down to the next step (lit once this step is done). It
            tucks behind the next step's solid icon circle, so no exact math. */}
        {connector ? (
          <span
            className={`absolute left-1/2 top-full h-8 w-px -translate-x-1/2 ${
              state === "done" ? "bg-primary/40" : "bg-border"
            }`}
          />
        ) : null}

        {/* Pulse ring on the active step */}
        {state === "active" && !reduce ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
          />
        ) : null}
        <div
          className={`relative flex size-11 items-center justify-center rounded-full ${
            state === "todo"
              ? "bg-muted text-muted-foreground/60"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === "done" ? (
              <motion.span
                key="done"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                <CheckCircle2 className="size-5" />
              </motion.span>
            ) : state === "active" ? (
              <motion.span
                key="active"
                animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                <Icon className="size-5" />
              </motion.span>
            ) : (
              <motion.span key="todo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Icon className="size-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 min-w-0 flex-1">
        <p
          className={`truncate text-[15px] font-semibold ${
            state === "todo" ? "text-muted-foreground/70" : "text-foreground"
          }`}
        >
          {step.title}
          {state === "active" && last ? <AnimatedDots /> : null}
        </p>
        <p className="truncate text-sm text-muted-foreground">{step.desc}</p>
      </div>

      {/* Trailing status: check for done, pulsing dot for active. */}
      {state === "done" ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="relative z-10 shrink-0 text-primary"
        >
          <Check className="size-5" strokeWidth={3} />
        </motion.span>
      ) : state === "active" && !reduce ? (
        <motion.span
          className="relative z-10 size-2.5 shrink-0 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      ) : null}
    </div>
  )
}

function AnimatedDots() {
  const reduce = useReducedMotion()
  if (reduce) return <span>…</span>
  return (
    <span className="ml-0.5 inline-flex">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
        >
          .
        </motion.span>
      ))}
    </span>
  )
}
