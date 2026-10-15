"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, FlaskConical, LogOut, Menu as MenuIcon, Settings as SettingsIcon } from "lucide-react"

import { allNavItems, isActive } from "@/config/nav"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { DomainSwitcher } from "@/components/dashboard/domain-switcher"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function pageTitle(pathname: string): string {
  const match = allNavItems
    .filter((i) => isActive(pathname, i))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]
  return match?.label ?? "Dashboard"
}

export function AppTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const { user, logout, activeWorkspace } = useDashboard()
  const initials =
    `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()

  return (
    <header className="dashboard-topbar sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <MenuIcon className="size-5" />
      </Button>

      <div className="flex min-w-0 items-center gap-2 text-sm">
        {/* First crumb = the domain every page works on (switch it here). */}
        <DomainSwitcher />
        <ChevronRight className="hidden size-3 shrink-0 text-muted-foreground sm:block" />
        <span className="hidden truncate rounded-md bg-primary/8 px-2 py-0.5 font-semibold text-primary sm:inline">{pageTitle(pathname)}</span>
        {activeWorkspace?.is_sandbox ? (
          <span
            title="Sandbox workspace — test data (DataForSEO Sandbox), kept separate from live"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
          >
            <FlaskConical className="size-3" />
            Sandbox
          </span>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <CommandPalette />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="dashboard-avatar flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            aria-label="Account menu"
          >
            {initials}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="text-sm font-medium text-foreground">
                {user.first_name} {user.last_name}
              </span>
              <span className="truncate text-xs font-normal">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <SettingsIcon />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout()
              }}
              className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive [&_svg]:text-destructive!"
            >
              <LogOut />
              <span>Log out</span>
            </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
