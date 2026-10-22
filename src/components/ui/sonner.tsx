"use client"

import { Toaster as SonnerToaster } from "sonner"

import { useTheme } from "@/components/theme-provider"

export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-lg",
          // Tint the buttons to each toast's own text color (works on success/
          // error/default, light + dark) instead of Sonner's near-black default.
          actionButton: "!bg-current/15 !text-current !font-medium !rounded-md !px-2.5 hover:!bg-current/25",
          cancelButton: "!bg-current/10 !text-current !rounded-md !px-2.5 hover:!bg-current/20",
        },
      }}
    />
  )
}
