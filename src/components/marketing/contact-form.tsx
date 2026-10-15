"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { site } from "@/config/site"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Marketing contact / demo form. Client island with basic validation.
 *
 * NOTE: submission is not yet wired to a backend endpoint — on submit it shows
 * a success state locally. Wire `onSubmit` to the real API before launch. The
 * contact email is shown as a working fallback.
 */
export function ContactForm({ demo = false }: { demo?: boolean }) {
  const [status, setStatus] = React.useState<"idle" | "error" | "done">("idle")
  const [error, setError] = React.useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get("name") || "").trim()
    const email = String(form.get("email") || "").trim()
    if (!name || !email) {
      setError("Please add your name and email.")
      setStatus("error")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.")
      setStatus("error")
      return
    }
    // TODO: POST to the backend contact endpoint when available.
    setError(null)
    setStatus("done")
  }

  if (status === "done") {
    return (
      <div className="surface rounded-3xl p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Check className="size-6" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold">Thanks — we&apos;ll be in touch</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We received your details. Prefer email? Reach us any time at{" "}
          <a href={`mailto:${site.contact.email}`} className="text-brand underline-offset-4 hover:underline">
            {site.contact.email}
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="surface rounded-3xl p-6 sm:p-8" noValidate>
      <div className="mb-6 border-b border-border pb-5">
        <h2 className="font-heading text-xl font-semibold tracking-tight">{demo ? "Request your demo" : "Send us a message"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {demo ? "Tell us a little about your team and we'll set up a time." : "We read every message and reply personally."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required className="h-11 rounded-xl" />
        </Field>
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11 rounded-xl" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Company" htmlFor="company" optional>
          <Input id="company" name="company" autoComplete="organization" className="h-11 rounded-xl" />
        </Field>
      </div>
      <div className="mt-4">
        <Field label={demo ? "What would you like to see?" : "How can we help?"} htmlFor="message" optional>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          />
        </Field>
      </div>

      {status === "error" && error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="brand" size="xl" className="mt-6 w-full">
        {demo ? "Request demo" : "Send message"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Or email us at{" "}
        <a href={`mailto:${site.contact.email}`} className="underline-offset-4 hover:underline">
          {site.contact.email}
        </a>
      </p>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {label}
        {optional ? <span className="text-xs font-normal text-muted-foreground">(optional)</span> : null}
      </label>
      {children}
    </div>
  )
}
