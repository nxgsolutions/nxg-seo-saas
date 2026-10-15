"use client"

import { Select as BaseSelect } from "@base-ui/react/select"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = BaseSelect.Root

function SelectTrigger({ className, children, ...props }: BaseSelect.Trigger.Props) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "flex h-9 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:border-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="text-muted-foreground">
        <ChevronsUpDown className="size-4" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

function SelectValue(props: BaseSelect.Value.Props) {
  return <BaseSelect.Value {...props} />
}

function SelectContent({ className, children, ...props }: BaseSelect.Popup.Props) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={6} align="start" className="z-50 outline-none">
        <BaseSelect.Popup
          className={cn(
            "max-h-72 min-w-[var(--anchor-width,10rem)] origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
            "transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  )
}

function SelectItem({ className, children, ...props }: BaseSelect.Item.Props) {
  return (
    <BaseSelect.Item
      className={cn(
        "relative flex cursor-pointer select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 items-center gap-2 rounded-lg py-1.5 pr-3 pl-8 text-sm outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemIndicator className="absolute left-2.5 flex items-center">
        <Check className="size-4" />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
