"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react"

import { toast } from "sonner"

import { authApi } from "@/lib/api/auth"
import { plansApi, formatPrice, type Plan } from "@/lib/api/billing"
import { ApiError, NetworkError } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface FormState {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
}

function validate(values: FormState): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.first_name.trim()) errors.first_name = "First name is required."
  if (!values.last_name.trim()) errors.last_name = "Last name is required."

  if (!values.email.trim()) {
    errors.email = "Email is required."
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (!values.password) {
    errors.password = "Password is required."
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters."
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Password must include at least one letter and one number."
  }

  if (values.confirm_password !== values.password) {
    errors.confirm_password = "Passwords do not match."
  }

  return errors
}

function FieldMessage({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs text-destructive"
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [values, setValues] = React.useState<FormState>(EMPTY)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = React.useState(true)
  const [selectedPlan, setSelectedPlan] = React.useState("free")

  React.useEffect(() => {
    let alive = true
    plansApi
      .list()
      .then((p) => {
        if (alive) setPlans(p)
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setPlansLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  function update(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Clear a field error as the user corrects it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    if (formError) setFormError(null)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      await authApi.register({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        password: values.password,
        plan_code: selectedPlan,
      })
      toast.success("Account created — welcome to NXGSEO!")
      // Log the new user straight in and start onboarding — no detour to /login.
      try {
        await authApi.login({ email: values.email.trim(), password: values.password })
        setSuccess(true)
        setTimeout(() => router.push("/onboarding"), 900)
      } catch {
        // Auto-login failed — fall back to manual sign-in.
        setSuccess(true)
        setTimeout(() => router.push("/login"), 1800)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors((prev) => ({
            ...prev,
            email: "An account with this email already exists.",
          }))
        } else if (err.fieldErrors.length > 0) {
          const mapped: FieldErrors = {}
          for (const fe of err.fieldErrors) {
            if (fe.field in EMPTY) {
              mapped[fe.field as keyof FormState] = fe.message
            }
          }
          if (Object.keys(mapped).length > 0) {
            setErrors((prev) => ({ ...prev, ...mapped }))
          } else {
            setFormError(err.message)
          }
        } else if (err.status >= 500) {
          // Server-side failure — show the server's explanation so the user
          // knows it's not their input (and that no account was created).
          setFormError(
            err.message ||
              "The server had a problem creating your account. Please try again in a moment."
          )
        } else {
          setFormError(err.message || "Something went wrong. Please try again.")
        }
      } else if (err instanceof NetworkError) {
        // Can't reach the backend at all (offline, server down, CORS).
        setFormError(err.message)
      } else {
        setFormError("Something went wrong. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-7" />
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Account created
            </h2>
            <p className="text-sm text-muted-foreground">
              Your account is ready. Redirecting you to sign in…
            </p>
          </div>
          <Button
            render={<Link href="/login" />}
            variant="outline"
            className="mt-2"
          >
            Continue to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start optimizing for search and AI engines in minutes.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-4">
          <AnimatePresence initial={false}>
            {formError ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Alert variant="destructive">
                  <TriangleAlert />
                  <AlertTitle>Registration failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {plansLoading ? (
            <div className="space-y-2">
              <Label>Choose a plan</Label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[4.25rem] w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-2">
              <Label>Choose a plan</Label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => {
                  const active = selectedPlan === p.code
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => setSelectedPlan(p.code)}
                      disabled={submitting}
                      className={cn(
                        "rounded-lg border p-2.5 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80"
                      )}
                    >
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.code === "enterprise"
                          ? "Custom"
                          : `${formatPrice(p.price_cents, p.currency)}${p.price_cents > 0 ? "/mo" : ""}`}
                      </p>
                      {p.price_cents > 0 ? (
                        <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          1-yr free trial
                        </p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPlan === "free"
                  ? "Free forever — upgrade anytime."
                  : "Starts with a 1-year free trial. No card required now."}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                autoComplete="given-name"
                value={values.first_name}
                onValueChange={(v) => update("first_name", v)}
                aria-invalid={!!errors.first_name}
                disabled={submitting}
                placeholder="Raj"
              />
              <FieldMessage message={errors.first_name} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                autoComplete="family-name"
                value={values.last_name}
                onValueChange={(v) => update("last_name", v)}
                aria-invalid={!!errors.last_name}
                disabled={submitting}
                placeholder="Developer"
              />
              <FieldMessage message={errors.last_name} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onValueChange={(v) => update("email", v)}
              aria-invalid={!!errors.email}
              disabled={submitting}
              placeholder="you@company.com"
            />
            <FieldMessage message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onValueChange={(v) => update("password", v)}
                aria-invalid={!!errors.password}
                disabled={submitting}
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <FieldMessage message={errors.password} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.confirm_password}
              onValueChange={(v) => update("confirm_password", v)}
              aria-invalid={!!errors.confirm_password}
              disabled={submitting}
              placeholder="Re-enter your password"
            />
            <FieldMessage message={errors.confirm_password} />
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
