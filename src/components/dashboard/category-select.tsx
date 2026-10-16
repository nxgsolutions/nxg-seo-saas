"use client"

import { Check, Loader2, Plus } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategories, useCreateCategory } from "@/hooks/api/use-categories"

// Select can't hold "", so "no category" gets a sentinel value.
const UNCATEGORIZED = "__none__"

const FIELD_CLASS =
  "flex min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs " +
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"

/**
 * Industry-category picker with an inline "New category" add. `value` is a
 * category id or null (uncategorized); `onChange` receives the id or null.
 * Categories are global, so the picker shares its list/cache everywhere.
 */
export function CategorySelect({ value, onChange, disabled }: {
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}) {
  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState("")

  async function add() {
    const name = newName.trim()
    if (!name) return
    try {
      const created = await createCategory.mutateAsync(name)
      onChange(created.id)
      setAdding(false)
      setNewName("")
      toast.success(`Added category "${created.name}"`)
    } catch {
      toast.error("Couldn't add the category.")
    }
  }

  const selected = value ?? UNCATEGORIZED
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>Category</Label>
        {!adding && (
          <Button type="button" variant="outline" size="xs" onClick={() => setAdding(true)} disabled={disabled}>
            <Plus className="size-3.5" /> New category
          </Button>
        )}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void add() } }}
            placeholder="e.g. Real Estate" className={FIELD_CLASS} disabled={createCategory.isPending}
          />
          <Button type="button" size="sm" onClick={() => void add()} disabled={createCategory.isPending || !newName.trim()}>
            {createCategory.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setAdding(false); setNewName("") }} disabled={createCategory.isPending}>
            Cancel
          </Button>
        </div>
      ) : (
        <Select value={selected} onValueChange={(v) => onChange((v as string) === UNCATEGORIZED ? null : (v as string))} disabled={disabled}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue>{(v) => (v === UNCATEGORIZED ? "Uncategorized" : (categories.find((c) => c.id === v)?.name ?? "Category"))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground">
        Scopes competitor suggestions to this site&apos;s industry. Uncategorized uses all of this workspace&apos;s keywords.
      </p>
    </div>
  )
}
