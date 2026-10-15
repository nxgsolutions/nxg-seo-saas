"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react"

import { authApi } from "@/lib/api/auth"
import { ApiError, NetworkError } from "@/lib/api/client"
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

interface FormState {
  email: string
  password: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Read a safe post-login redirect target from the URL (?next=/path). */
function safeNext(): string {
  if (typeof window === "undefined") return "/dashboard"
  const next = new URLSearchParams(window.location.search).get("next")
  // Only allow same-origin absolute paths; reject protocol-relative (//host).
  if (next && next.startsWith("/") && !next.startsWith("//")) return next
  return "/dashboard"
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

export function LoginForm() {
  const router = useRouter()
  const [values, setValues] = React.useState<FormState>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  function update(field: keyof FormState, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    if (formError) setFormError(null)
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!values.email.trim()) next.email = "Email is required."
    else if (!EMAIL_RE.test(values.email.trim()))
      next.email = "Enter a valid email address."
    if (!values.password) next.password = "Password is required."
    return next
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const { user } = await authApi.login({
        email: values.email.trim(),
        password: values.password,
      })
      // New users finish onboarding first; otherwise honor the requested page.
      router.push(user.is_onboarded ? safeNext() : "/onboarding")
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setFormError("Invalid email or password.")
        } else {
          setFormError("Something went wrong. Please try again.")
        }
      } else if (err instanceof NetworkError) {
        setFormError(err.message)
      } else {
        setFormError("Something went wrong. Please try again.")
      }
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
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
                  <AlertTitle>Sign in failed</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                autoComplete="current-password"
                value={values.password}
                onValueChange={(v) => update("password", v)}
                aria-invalid={!!errors.password}
                disabled={submitting}
                placeholder="Your password"
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
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
