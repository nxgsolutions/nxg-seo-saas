"use client"

import { Check, Loader2, Plus, Settings2, Sparkles } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { describeError, Modal } from "@/components/dashboard/domain-dialogs"
import { COUNTRIES, LANGUAGES, labelFor } from "@/app/dashboard/settings/_lib/settings-helpers"
import { useCategories, useCreateCategory } from "@/hooks/api/use-categories"
import type { Domain } from "@/lib/api/workspaces"
import { workspacesApi } from "@/lib/api/workspaces"

// Sentinel for "fall back to the workspace default" (Select can't hold "").
const DEFAULT = "__default__"
// Sentinel for "no category" (Select can't hold "").
const UNCATEGORIZED = "__none__"

const FIELD_CLASS =
  "flex min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs " +
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"

/** Edit a domain's market + niche (country, language, topics, brands, local). */
export function EditDomainDialog({ domain, onOpenChange }: {
  domain: Domain | null
  onOpenChange: (open: boolean) => void
}) {
  const { activeWorkspace, reloadDomains } = useDashboard()
  const wsCountry = labelFor(COUNTRIES, activeWorkspace?.default_country ?? "in", "India")
  const wsLanguage = labelFor(LANGUAGES, activeWorkspace?.default_language ?? "en", "English")
  const { data: categories = [] } = useCategories()
  const createCategory = useCreateCategory()

  const [country, setCountry] = React.useState(DEFAULT)
  const [language, setLanguage] = React.useState(DEFAULT)
  const [topics, setTopics] = React.useState("")
  const [brands, setBrands] = React.useState("")
  const [isLocal, setIsLocal] = React.useState(false)
  const [category, setCategory] = React.useState(UNCATEGORIZED)
  const [addingCategory, setAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [deriving, setDeriving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset the form whenever a different domain is opened (adjusted during render).
  const [prevId, setPrevId] = React.useState(domain?.id)
  if (domain?.id !== prevId) {
    setPrevId(domain?.id)
    setCountry(domain?.country || DEFAULT)
    setLanguage(domain?.language || DEFAULT)
    setTopics(domain?.topic_terms ?? "")
    setBrands(domain?.brand_terms ?? "")
    setIsLocal(domain?.is_local ?? false)
    setCategory(domain?.category_id || UNCATEGORIZED)
    setAddingCategory(false)
    setNewCategory("")
    setError(null)
  }

  async function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    try {
      const created = await createCategory.mutateAsync(name)
      setCategory(created.id)
      setAddingCategory(false)
      setNewCategory("")
      toast.success(`Added category "${created.name}"`)
    } catch (err) {
      setError(describeError(err, "Couldn't add the category."))
    }
  }

  async function suggest() {
    if (!domain || !activeWorkspace) return
    setDeriving(true); setError(null)
    try {
      const { terms } = await workspacesApi.deriveDomainTopics(activeWorkspace.id, domain.id)
      if (terms.length === 0) { toast.info("Couldn't read topics from the site — add them manually."); return }
      // Merge with what's there, de-duped, keeping order.
      const have = new Set(topics.split(/[,\n]/).map((t) => t.trim().toLowerCase()).filter(Boolean))
      const merged = [...have]
      for (const t of terms) if (!have.has(t.toLowerCase())) merged.push(t.toLowerCase())
      setTopics(merged.join(", "))
      toast.success(`Added ${terms.length} suggested terms`)
    } catch (err) {
      setError(describeError(err, "Couldn't suggest topics."))
    } finally { setDeriving(false) }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!domain || !activeWorkspace) return
    setBusy(true); setError(null)
    try {
      await workspacesApi.updateDomain(activeWorkspace.id, domain.id, {
        country: country === DEFAULT ? "" : country,
        language: language === DEFAULT ? "" : language,
        topic_terms: topics.trim(),
        brand_terms: brands.trim(),
        is_local: isLocal,
        category_id: category === UNCATEGORIZED ? null : category,
      })
      toast.success(`Saved settings for ${domain.domain}`)
      onOpenChange(false)
      await reloadDomains()
    } catch (err) {
      setError(describeError(err, "Could not save the settings."))
    } finally { setBusy(false) }
  }

  return (
    <Modal open={!!domain} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}
      title={<span className="flex items-center gap-2"><Settings2 className="size-5 text-primary" /> {domain?.domain} settings</span>}
      description="Set this site's market and niche. Competitor gaps and suggestions use the topics; empty values fall back to the workspace default.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={country} onValueChange={(v) => setCountry((v as string) ?? DEFAULT)} disabled={busy}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{(v) => (v === DEFAULT ? `Workspace default (${wsCountry})` : labelFor(COUNTRIES, v as string, "Country"))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT}>Workspace default ({wsCountry})</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage((v as string) ?? DEFAULT)} disabled={busy}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{(v) => (v === DEFAULT ? `Workspace default (${wsLanguage})` : labelFor(LANGUAGES, v as string, "Language"))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT}>Workspace default ({wsLanguage})</SelectItem>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Category</Label>
            {!addingCategory && (
              <Button type="button" variant="outline" size="xs" onClick={() => setAddingCategory(true)} disabled={busy}>
                <Plus className="size-3.5" /> New category
              </Button>
            )}
          </div>
          {addingCategory ? (
            <div className="flex gap-2">
              <input
                autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory() } }}
                placeholder="e.g. Real Estate" className={FIELD_CLASS} disabled={createCategory.isPending}
              />
              <Button type="button" size="sm" onClick={addCategory} disabled={createCategory.isPending || !newCategory.trim()}>
                {createCategory.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Add
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingCategory(false); setNewCategory("") }} disabled={createCategory.isPending}>
                Cancel
              </Button>
            </div>
          ) : (
            <Select value={category} onValueChange={(v) => setCategory((v as string) ?? UNCATEGORIZED)} disabled={busy}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>{(v) => (v === UNCATEGORIZED ? "Uncategorized" : (categories.find((c) => c.id === v)?.name ?? "Category"))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">Keeps competitor suggestions within this site&apos;s industry. Uncategorized shows all.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="topic-terms">Niche topics</Label>
            <Button type="button" variant="outline" size="xs" onClick={suggest} disabled={deriving || busy}>
              {deriving ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Suggest from site
            </Button>
          </div>
          <textarea id="topic-terms" value={topics} onChange={(e) => setTopics(e.target.value)} rows={2} disabled={busy}
            placeholder="clinic, treatment, symptoms" className={FIELD_CLASS} />
          <p className="text-xs text-muted-foreground">Comma-separated. Leave empty to keep every competitor keyword (no niche filter).</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand-terms">Competitor brand terms to exclude</Label>
          <textarea id="brand-terms" value={brands} onChange={(e) => setBrands(e.target.value)} rows={2} disabled={busy}
            placeholder="acme, globex" className={FIELD_CLASS} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={isLocal} disabled={busy}
            onChange={(e) => setIsLocal(e.target.checked)} />
          Local business — keep &quot;near me&quot; keywords
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save settings
          </Button>
        </div>
      </form>
    </Modal>
  )
}
