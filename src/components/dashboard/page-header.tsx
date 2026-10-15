import type { ReactNode } from "react"

import { PageHelp } from "@/components/dashboard/page-help"

/** Shared page hierarchy for dashboard tools and workspace settings. */
export function PageHeader({ title, description, eyebrow, actions, help }: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  /** When set, a "?" button after the title opens a popover with this content. */
  help?: ReactNode
}) {
  return (
    <div className="dashboard-page-header">
      <div className="min-w-0">
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
