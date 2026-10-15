import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ComingSoon({
  icon: Icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Badge variant="primary">Coming soon</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-5 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" />
          </div>
          <div className="max-w-md space-y-1">
            <p className="text-base font-medium">{description}</p>
            <p className="text-sm text-muted-foreground">
              This module is on the roadmap. In the meantime, the Page Audit tool
              is live.
            </p>
          </div>
          <ul className="grid max-w-md gap-2 text-left text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {b}
              </li>
            ))}
          </ul>
          <Button render={<Link href="/dashboard/page-audit" />}>
            Try Page Audit
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
