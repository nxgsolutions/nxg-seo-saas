"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { brand } from "@/config/brand"
import { BrandMark } from "@/components/layout/logo"
import { isActive, navSections, type NavItem } from "@/config/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher"
import { SidebarPlanCard } from "@/components/dashboard/sidebar-plan-card"

function NavLink({
  item,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  collapsed?: boolean
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isActive(pathname, item)

  // "Soon" items aren't navigable yet — render a non-clickable row.
  if (item.soon) {
    return (
      <div
        className="group flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/70"
        aria-disabled
      >
        <item.icon className="size-4 shrink-0 text-muted-foreground/60" />
        <span className={collapsed ? "sr-only" : "flex-1"}>{item.label}</span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          Soon
        </Badge>
      </div>
    )
  }

  return (
    <Link
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      href={item.href!}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "dashboard-nav-link group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className={collapsed ? "sr-only" : "flex-1"}>{item.label}</span>
    </Link>
  )
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const anyActive = isActive(pathname, item)
  const [open, setOpen] = React.useState(true)

  // Reopen on navigation to a child; still allow manual collapse.
  const [previousPath, setPreviousPath] = React.useState(pathname)
  if (previousPath !== pathname) {
    setPreviousPath(pathname)
    if (anyActive) setOpen(true)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          anyActive ? "text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <item.icon className={cn("size-4 shrink-0", anyActive ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-primary/15 pl-3">
          {(item.children ?? []).map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AppSidebar({ onNavigate, collapsed = false, onToggle }: { onNavigate?: () => void; collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname()

  return (
    <div className={cn("dashboard-sidebar flex h-full min-h-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar", collapsed ? "p-2" : "p-4")}>
      <div className={cn("flex shrink-0 items-center", collapsed ? "flex-col gap-3" : "justify-between gap-2")}>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-1"
        onClick={onNavigate}
      >
        <BrandMark className="dashboard-logo size-9 rounded-xl" />
        <span className={collapsed ? "sr-only" : "font-heading text-base font-extrabold tracking-tight"}>
          {brand.name}
        </span>
      </Link>

      {onToggle ? <Button variant="ghost" size="icon" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button> : null}
      </div>
      {!collapsed ? <WorkspaceSwitcher /> : null}

      <nav aria-label="Main navigation" className="sidebar-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {navSections.map((section, i) => (
          <div key={section.title ?? `section-${i}`} className={cn(section.title && "mt-3")}>
            {section.title && !collapsed ? (
              <p className="dashboard-nav-section px-3 pb-1.5 text-[11px] font-semibold uppercase">
                {section.title}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              {section.items.map((item) =>
                item.children && collapsed ? (
                  <Button key={item.label} variant="ghost" size="icon" onClick={onToggle} aria-label={`Expand sidebar to view ${item.label}`} title={item.label}><item.icon /></Button>
                ) : item.children ? (
                  <NavGroup
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <NavLink
                    key={item.href}
                    collapsed={collapsed}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed ? <SidebarPlanCard onNavigate={onNavigate} /> : null}
    </div>
  )
}
