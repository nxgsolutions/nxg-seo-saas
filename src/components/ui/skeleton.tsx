import { cn } from "@/lib/utils"

/** A pulsing placeholder block. Compose these to mirror the real content shape. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} {...props} />
}

export { Skeleton }
