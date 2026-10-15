"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { INTENT_ABBR, INTENT_STYLES } from "../_lib/keyword-analysis-helpers"

export function IntentBadge({ intent }: { intent: string }) {
  return (
    <Badge variant="outline" className={cn("font-normal", INTENT_STYLES[intent] ?? INTENT_STYLES.unknown)} title={intent}>
      {INTENT_ABBR[intent] ?? "—"}
    </Badge>
  )
}
