"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  /** False during SSR and the first client render, true after hydration. */
  mounted: boolean
  setTheme: (theme: Theme) => void
  toggle: () => void
}

// Hydration-safe mounted flag: false on the server and first client render,
// true after hydration — without a setState-in-effect cascade.
const emptySubscribe = () => () => {}
function useMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

const STORAGE_KEY = "theme"

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system"
  try {
    const value = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (value === "light" || value === "dark" || value === "system") {
      return value
    }
  } catch {
    // localStorage unavailable — fall back to system.
  }
  return "system"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializers keep the first client render in sync with the value the
  // anti-FOUC script already applied, without a setState-in-effect cascade.
  // The visible theme is driven by the `.dark` CSS class (set pre-hydration),
  // so a differing client value never causes a DOM hydration mismatch.
  const [theme, setThemeState] = React.useState<Theme>(getStoredTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    resolveTheme(getStoredTheme())
  )

  // Ensure the DOM class matches React state once mounted (defensive sync).
  React.useEffect(() => {
    applyThemeClass(resolvedTheme)
  }, [resolvedTheme])

  // React to OS theme changes while in "system" mode.
  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const resolved = getSystemTheme()
      setResolvedTheme(resolved)
      applyThemeClass(resolved)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore write failures (private mode, etc.)
    }
    const resolved = next === "system" ? getSystemTheme() : next
    setResolvedTheme(resolved)
    applyThemeClass(resolved)
  }, [])

  const toggle = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  const mounted = useMounted()

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, mounted, setTheme, toggle }),
    [theme, resolvedTheme, mounted, setTheme, toggle]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return ctx
}

/**
 * Inline script that sets the theme class before hydration to avoid a
 * flash of the wrong theme (FOUC). Rendered in <head>.
 */
export const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'dark' || ((!t || t === 'system') && m);
    var root = document.documentElement;
    if (dark) { root.classList.add('dark'); root.style.colorScheme = 'dark'; }
    else { root.classList.remove('dark'); root.style.colorScheme = 'light'; }
  } catch (e) {}
})();
`
