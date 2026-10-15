"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle({ prominent = false }: { prominent?: boolean }) {
  const { resolvedTheme, toggle, mounted } = useTheme()
  // Until mounted, render a stable label so SSR and first client render match.
  const label = !mounted
    ? "Toggle theme"
    : resolvedTheme === "dark"
      ? "Switch to light mode"
      : "Switch to dark mode"

  return (
    <Button
      variant={prominent ? "outline" : "ghost"}
      size="icon"
      className={prominent ? "size-11" : undefined}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  )
}
