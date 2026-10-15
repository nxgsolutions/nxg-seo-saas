"use client"

import { AlertTriangle, Info, Loader2 } from "lucide-react"
import * as React from "react"

import {
  AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Reusable confirmation for risky actions (delete, replace, paid calls).
 *
 * Controlled: render it with `open` and handle `onConfirm`. While `onConfirm`'s
 * promise runs the buttons are disabled and the dialog stays open; it closes on
 * success and shows the error inline on failure (nothing happens silently).
 *
 * @example
 *   const [target, setTarget] = React.useState<Item | null>(null)
 *   <ConfirmDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}
 *     title={`Remove ${target?.name}?`} description="…" confirmLabel="Remove" tone="destructive"
 *     onConfirm={() => removeMutation.mutateAsync(target!.id)} />
 */
export function ConfirmDialog({
  open, onOpenChange, title, description, details, confirmLabel = "Confirm", cancelLabel = "Cancel",
  tone = "destructive", icon, onConfirm, errorText = "Something went wrong. Please try again.",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Extra content: what will happen, lists, notes. */
  details?: React.ReactNode
  confirmLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
  /** destructive = red confirm (deletes / replaces); default = primary (e.g. paid action). */
  tone?: "destructive" | "default"
  icon?: React.ReactNode
  onConfirm: () => unknown | Promise<unknown>
  /** Fallback message when the action fails without a readable error. */
  errorText?: string
}) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fresh state every time it opens (adjusted during render, no effect).
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setError(null)
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : errorText)
    } finally {
      setBusy(false)
    }
  }

  const destructive = tone === "destructive"
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full",
            destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")} aria-hidden="true">
            {icon ?? (destructive ? <AlertTriangle className="size-5" /> : <Info className="size-5" />)}
          </span>
          <div className="min-w-0 space-y-1.5">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </div>
        </AlertDialogHeader>
        {details && <div className="text-sm sm:pl-14">{details}</div>}
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:ml-14">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" disabled={busy} />}>{cancelLabel}</AlertDialogClose>
          <Button variant={destructive ? "destructive" : "default"} onClick={confirm} disabled={busy} autoFocus={!destructive}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
