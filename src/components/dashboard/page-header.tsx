import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PageHelp } from "@/components/dashboard/page-help"

/** Shared page hierarchy for dashboard tools and workspace settings. */
export function PageHeader({ title, description, eyebrow, actions, help, backHref, backLabel }: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  /** When set, a "?" button after the title opens a popover with this content. */
  help?: ReactNode
  /** When set, a "← {backLabel}" link renders above the title so a nested page
   *  can return to its parent. */
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="dashboard-page-header">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="group -ml-1 mb-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            {backLabel ?? "Back"}
          </Link>
        ) : null}
        {eyebrow ? <p className="dashboard-eyebrow">{eyebrow}</p> : null}
        <h1 className="dashboard-page-title">
          {title}
          {help ? <PageHelp label={typeof title === "string" ? title : undefined}>{help}</PageHelp> : null}
        </h1>
        {description ? <p className="dashboard-page-description">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
