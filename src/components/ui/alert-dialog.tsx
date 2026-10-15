"use client"

import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Alert dialog (shadcn/ui API on Base UI). A modal that interrupts the user for
 * an important decision: focus is trapped, it can't be dismissed by clicking
 * the backdrop, Escape cancels. For confirmations use <ConfirmDialog>.
 */
function AlertDialog(props: Primitive.Root.Props) {
  return <Primitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger(props: Primitive.Trigger.Props) {
  return <Primitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogContent({ className, children, ...props }: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
      />
      <Primitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          // .dashboard-shell: the popup renders in a portal, outside the dashboard's theme scope.
          "dashboard-shell fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4",
          "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl outline-none",
          "transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {children}
      </Primitive.Popup>
    </Primitive.Portal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-header" className={cn("flex gap-4", className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
  )
}

function AlertDialogTitle({ className, ...props }: Primitive.Title.Props) {
  return <Primitive.Title data-slot="alert-dialog-title" className={cn("font-heading text-lg font-semibold tracking-tight", className)} {...props} />
}

function AlertDialogDescription({ className, ...props }: Primitive.Description.Props) {
  return <Primitive.Description data-slot="alert-dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

/** Closes the dialog (use `render={<Button … />}` for the Cancel button). */
function AlertDialogClose(props: Primitive.Close.Props) {
  return <Primitive.Close data-slot="alert-dialog-close" {...props} />
}

export {
  AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
}
