"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowRight,
  Gauge,
  Search,
  Sparkles,
  Zap
} from "lucide-react"
import Link from "next/link"


export function QuickActionsPanel() {
  return (<Card className="lg:col-span-1">
    <CardHeader>
      <CardTitle className="text-base">Quick actions</CardTitle>
      <CardDescription>Make your next move.</CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-2">
      {[
        { href: "/dashboard/page-audit", label: "Run a page audit", icon: Gauge },
        { href: "/dashboard/page-optimization", label: "Optimize a page", icon: Zap },
        { href: "/dashboard/keyword-analysis", label: "Analyze keywords", icon: Search },
        { href: "/dashboard/ai-search", label: "AI visibility", icon: Sparkles },
      ].map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="dashboard-quick-action"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <a.icon className="size-4" />
          </span>
          <span className="flex-1">{a.label}</span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      ))}
    </CardContent>
  </Card>)
}
