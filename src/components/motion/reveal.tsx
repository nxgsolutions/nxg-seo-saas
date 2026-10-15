"use client"

/**
 * Reusable scroll-reveal primitives built on Motion.
 *
 * <Reveal>   — fades + rises a block into view once, on scroll.
 * <Stagger>  — a container whose <StaggerItem> children enter in sequence.
 *
 * All respect `prefers-reduced-motion`: when set, content renders immediately
 * with no transform, so nothing is hidden or janky for those users.
 */
import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { revealVariants, staggerContainer, staggerItem } from "@/theme/animations"

interface BaseProps {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  id?: string
}

interface RevealProps extends BaseProps {
  /** Delay before the reveal starts (seconds). */
  delay?: number
  /** How much of the element must be visible before it triggers (0–1). */
  amount?: number
}

export function Reveal({ children, delay = 0, amount = 0.3, ...rest }: RevealProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div {...rest}>{children}</div>

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={revealVariants}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

interface StaggerProps extends BaseProps {
  stagger?: number
  delay?: number
  amount?: number
}

export function Stagger({ children, stagger = 0.08, delay = 0, amount = 0.2, ...rest }: StaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div {...rest}>{children}</div>

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={staggerContainer(stagger, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, ...rest }: BaseProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div {...rest}>{children}</div>
  return (
    <motion.div variants={staggerItem} {...rest}>
      {children}
    </motion.div>
  )
}
