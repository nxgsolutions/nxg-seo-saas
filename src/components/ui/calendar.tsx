"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/** Themed react-day-picker. Styling is driven entirely by `classNames` (Tailwind
 *  + design tokens) so no external stylesheet import is needed. */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "opacity-80 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "opacity-80 hover:opacity-100"),
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.75rem] font-normal text-muted-foreground",
        week: "mt-1.5 flex w-full",
        day: "size-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-md p-0 font-normal aria-selected:bg-primary aria-selected:text-primary-foreground",
        ),
        today: "rounded-md bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-40",
        range_start: "rounded-l-md bg-primary/10",
        range_middle: "bg-primary/10",
        range_end: "rounded-r-md bg-primary/10",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left"
            ? <ChevronLeft className={cn("size-4", c)} />
            : <ChevronRight className={cn("size-4", c)} />,
      }}
      {...props}
    />
  )
}

export { Calendar }
