/**
 * Shared motion tokens for the public site.
 *
 * Durations, easings and reusable Motion variants live here so every animated
 * component pulls from one system instead of inventing its own timing. Keep
 * animations subtle; heavy motion is opt-in per component.
 */
import type { Transition, Variants } from "motion/react"

export const easing = {
  /** Smooth, slightly weighted ease for entrances. */
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
}

export const duration = {
  fast: 0.25,
  base: 0.5,
  slow: 0.7,
}

export const springSoft: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.6 }

/** Fade + rise, used by <Reveal>. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.out },
  },
}

/** Container that staggers its children (pair with staggerItem). */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
})

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easing.out } },
}
