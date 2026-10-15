"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import * as React from "react"

/** Small copy-to-clipboard button with a short "Copied" confirmation. */
export function CopyButton({ text, label = "Copy", className, iconOnly = false }: {
  text: string
  label?: string
  className?: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* clipboard blocked — nothing to do */
    }
  }

  return (
    <Button type="button" variant="ghost" size={iconOnly ? "icon" : "sm"} onClick={copy}
      aria-label={iconOnly ? (copied ? "Copied" : label) : undefined}
      className={cn("shrink-0 text-muted-foreground hover:text-foreground", iconOnly && "size-8", className)}>
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {!iconOnly && (copied ? "Copied" : label)}
    </Button>
  )
}
