"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { scoreColor } from "../_lib/page-score-helpers"

/** Circular 0-100 dial for the overall score. */
export function ScoreGauge({ score }: { score: number }) {
  const c = 2 * Math.PI * 52
  return (
    <div className="relative flex size-32 items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
        <motion.circle
          cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
          className={cn("stroke-current", scoreColor(score))}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-3xl font-semibold tabular-nums", scoreColor(score))}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}
