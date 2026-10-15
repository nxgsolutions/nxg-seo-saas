"use client"

import * as React from "react"

export function useTextWidth() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  return React.useCallback((text: string, font: string) => {
    if (typeof document === "undefined") return 0
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas")
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return 0
    ctx.font = font
    return ctx.measureText(text).width
  }, [])
}
