import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({ icon: Icon, label, value, hint, delta }: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  delta?: number | null
}) {
  return (
    <Card className="dashboard-stat">
      <CardHeader className="flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <span className="dashboard-icon"><Icon aria-hidden="true" className="size-4" /></span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <p className="dashboard-stat-value">{value}</p>
          {delta != null && delta !== 0 ? (
            <span className={cn("dashboard-delta", delta > 0 ? "text-chart-3" : "text-destructive")}>
              {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta > 0 ? "+" : ""}{delta}
            </span>
          ) : null}
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
