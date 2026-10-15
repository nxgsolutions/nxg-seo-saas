"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react"

import { brand } from "@/config/brand"
import { authApi } from "@/lib/api/auth"
import { workspacesApi, type Workspace } from "@/lib/api/workspaces"
import { ApiError, NetworkError } from "@/lib/api/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

type Status = "loading" | "ready"

const STEPS = [
  { n: 1, label: "Workspace", desc: "Name your workspace" },
  { n: 2, label: "Domain", desc: "Add the site you want to grow" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [attempt, setAttempt] = React.useState(0)
  const [status, setStatus] = React.useState<Status>("loading")
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null)
  const [firstName, setFirstName] = React.useState("")

  const [step, setStep] = React.useState<1 | 2>(1)
  const [wsName, setWsName] = React.useState("")
  const [siteUrl, setSiteUrl] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let alive = true
    authApi
      .me()
      .then((u) => {
        if (!alive) return
        if (u.is_onboarded) {
          router.replace("/dashboard")
          return
        }
        setFirstName(u.first_name)
        return workspacesApi.list().then((list) => {
          if (!alive) return
          const ws = list[0] ?? null
          setWorkspace(ws)
          setWsName(ws?.name ?? "")
          setStatus("ready")
        })
      })
      .catch((err: unknown) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?next=/onboarding")
          return
        }
        setError("We couldn’t load your workspace. Please try again.")
      })
    return () => {
      alive = false
    }
  }, [router, attempt])

  function describeError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) return err.fieldErrors[0]?.message ?? err.message
    if (err instanceof NetworkError) return err.message
    return fallback
  }

  async function handleContinue() {
    setError(null)
    const name = wsName.trim()
    if (!name) {
      setError("Workspace name is required.")
      return
    }
    setBusy(true)
    try {
      if (workspace && name !== workspace.name) {
        const updated = await workspacesApi.rename(workspace.id, name)
        setWorkspace(updated)
      }
      setStep(2)
    } catch (err) {
      setError(describeError(err, "Could not save the workspace name."))
    } finally {
      setBusy(false)
    }
  }

  async function finish(withDomain: boolean) {
    if (!workspace) return
    setError(null)
    setBusy(true)
    try {
      if (withDomain) {
        const url = siteUrl.trim()
        if (!url) {
          setError("Enter your domain, or choose “Skip for now”.")
          setBusy(false)
          return
        }
        await workspacesApi.addDomain(workspace.id, url)
      }
      await authApi.completeOnboarding()
      router.replace("/dashboard")
    } catch (err) {
      setError(describeError(err, "Something went wrong. Please try again."))
      setBusy(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        {error ? (
          <Alert className="mx-6 max-w-md">
            <AlertDescription>
              <p>{error}</p>
              <Button className="mt-3" onClick={() => { setError(null); setAttempt((n) => n + 1) }}>Try again</Button>
            </AlertDescription>
          </Alert>
        ) : <><Loader2 className="size-6 animate-spin text-muted-foreground" /><span className="sr-only">Loading workspace…</span></>}
      </div>
    )
  }

  const anim = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      {/* Brand / progress panel */}
      <aside className="relative hidden overflow-hidden bg-auth-panel text-auth-panel-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 30% 20%, currentColor 0, transparent 60%), radial-gradient(50% 50% at 80% 70%, currentColor 0, transparent 55%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-auth-panel-foreground/10 ring-1 ring-auth-panel-foreground/20">
            <Sparkles className="size-4" />
          </div>
          <span className="text-base font-semibold tracking-tight">{brand.name}</span>
        </div>

        <motion.div className="relative max-w-sm" {...anim(0.1)}>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""} 👋
          </h2>
          <p className="mt-3 text-sm text-auth-panel-foreground/75">
            Let&apos;s get your workspace ready. Two quick steps and you&apos;ll be
            auditing pages in under a minute.
          </p>

          <ul className="mt-8 space-y-4">
            {STEPS.map((s) => {
              const done = step > s.n
              const active = step === s.n
              return (
                <li key={s.n} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition-colors",
                      done
                        ? "bg-auth-panel-foreground text-auth-panel ring-transparent"
                        : active
                          ? "bg-auth-panel-foreground/15 ring-auth-panel-foreground/40"
                          : "ring-auth-panel-foreground/20 text-auth-panel-foreground/60"
                    )}
                  >
                    {done ? <Check className="size-4" /> : s.n}
                  </span>
                  <div>
                    <p className={cn("text-sm font-medium", !active && !done && "text-auth-panel-foreground/60")}>
                      {s.label}
                    </p>
                    <p className="text-xs text-auth-panel-foreground/60">{s.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </motion.div>

        <p className="relative text-xs text-auth-panel-foreground/55">
          You can change any of this later in Settings.
        </p>
      </aside>

      {/* Wizard */}
      <main className="relative flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">{brand.name}</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center">
          <div className="w-full max-w-md">
            {/* Progress bar */}
            <div className="mb-6 flex items-center gap-2">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    s.n <= step ? "bg-primary" : "bg-border"
                  )}
                />
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
              <p className="text-xs font-medium text-muted-foreground">
                Step {step} of 2
              </p>

              <AnimatePresence mode="wait" initial={false}>
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="mt-1 text-xl font-semibold tracking-tight">
                      Name your workspace
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A workspace keeps your sites, audits, and reports together.
                    </p>
                    <div className="mt-5 space-y-1.5">
                      <Label htmlFor="ws-name">Workspace name</Label>
                      <Input
                        id="ws-name"
                        value={wsName}
                        onValueChange={(v) => {
                          setWsName(v)
                          if (error) setError(null)
                        }}
                        placeholder="Acme Marketing"
                        disabled={busy}
                        aria-invalid={!!error}
                      />
                    </div>
                    {error ? (
                      <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}
                    <Button
                      className="mt-6 w-full"
                      size="lg"
                      onClick={handleContinue}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          Continue <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? undefined : { opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="mt-1 text-xl font-semibold tracking-tight">
                      Add your domain
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track SEO health and AI-search visibility for a site you own.
                    </p>
                    <div className="mt-5 space-y-1.5">
                      <Label htmlFor="site-url">Domain</Label>
                      <div className="relative">
                        <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="site-url"
                          value={siteUrl}
                          onValueChange={(v) => {
                            setSiteUrl(v)
                            if (error) setError(null)
                          }}
                          placeholder="example.com"
                          disabled={busy}
                          aria-invalid={!!error}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Just the domain, e.g. mystore.com — pasting a full link works too.
                      </p>
                    </div>
                    {error ? (
                      <Alert variant="destructive" className="mt-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}
                    <div className="mt-6 flex flex-col gap-3">
                      <Button size="lg" onClick={() => finish(true)} disabled={busy}>
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Rocket className="size-4" /> Finish setup
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setError(null)
                            setStep(1)
                          }}
                          disabled={busy}
                        >
                          <ArrowLeft className="size-4" /> Back
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => finish(false)}
                          disabled={busy}
                        >
                          Skip for now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
