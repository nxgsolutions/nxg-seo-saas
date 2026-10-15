"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

import { DashboardProvider } from "@/components/dashboard/dashboard-context"
import { QueryProvider } from "@/components/providers/query-provider"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppTopbar } from "@/components/dashboard/app-topbar"
import { WorkspaceScope } from "@/components/dashboard/workspace-scope"
import { SectionTabs } from "@/components/dashboard/section-tabs"
import { ConnectResultToast } from "@/components/dashboard/connect-result-toast"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Close the mobile drawer on route change (adjust during render).
  const [prevPath, setPrevPath] = React.useState(pathname)
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    if (mobileOpen) setMobileOpen(false)
  }

  return (
    <QueryProvider>
    <DashboardProvider>
      {/* The app fills the viewport up to an ultrawide cap, then centers beyond
          it. `self-center` (not mx-auto) is required because <body> is a column
          flex container — auto margins don't center on its cross axis. */}
      <div className={`dashboard-shell min-h-dvh w-full max-w-[3440px] self-center lg:grid ${collapsed ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
        {/* Desktop sidebar — sticky within the centered shell */}
        <aside className="hidden lg:block lg:h-dvh lg:sticky lg:top-0">
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        </aside>

        <a href="#dashboard-content" className="dashboard-skip-link">Skip to content</a>
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <Dialog.Popup className="dashboard-shell fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] bg-card shadow-xl">
              <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
              <Dialog.Close render={<Button variant="outline" size="icon" />} className="absolute right-3 top-3" aria-label="Close navigation"><X /></Dialog.Close>
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <div className="flex min-w-0 flex-col">
          <AppTopbar onMenuClick={() => setMobileOpen(true)} />
          <React.Suspense fallback={null}><ConnectResultToast /></React.Suspense>
          <main id="dashboard-content" tabIndex={-1} className="dashboard-main flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1600px]">
              {/* Fresh page state per workspace (no stale data from the previous workspace;
                  sandbox workspaces use DataForSEO Sandbox data, kept separate from live). */}
              <SectionTabs />
              <WorkspaceScope>{children}</WorkspaceScope>
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
    </QueryProvider>
  )
}
