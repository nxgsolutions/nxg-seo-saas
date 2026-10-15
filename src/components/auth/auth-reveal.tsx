"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

/**
 * On-mount reveal for the auth card. Client island so the surrounding
 * <AuthShell> and public chrome can stay server components. Respects
 * reduced-motion by rendering immediately with no transform.
 */
export function AuthReveal({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
