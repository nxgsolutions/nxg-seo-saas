"use client"

import { IntegrationsPanel } from "@/components/dashboard/integrations-panel"
import { PageHeader } from "@/components/dashboard/page-header"
import { CreateWorkspaceDialog } from "@/components/dashboard/create-workspace-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Globe, Loader2, Plus, Settings2, SlidersHorizontal, User } from "lucide-react"
import * as React from "react"
import { useSettingsScreen } from "../_hooks/use-settings-screen"
import { COUNTRIES, LANGUAGES, TIMEZONES, labelFor } from "../_lib/settings-helpers"

export default function SettingsPage() {
  const s = useSettingsScreen()
  const [creatingWs, setCreatingWs] = React.useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title={<> Settings </>} description={<> Manage your workspace, its defaults, integrations and your account. </>} />

      {/* Workspace name */}
      <Section icon={Settings2} title="Workspace" description="Rename the current workspace.">
        <form onSubmit={s.saveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="ws-name">Name</Label>
            <Input id="ws-name" value={s.name}
              onValueChange={(v) => { s.setName(v); if (s.nameError) s.setNameError(null); if (s.saved) s.setSaved(false) }}
              disabled={s.savingName || !s.activeWorkspace} aria-invalid={!!s.nameError} />
          </div>
          <Button type="submit" disabled={s.savingName || !s.activeWorkspace}>
            {s.savingName ? <Loader2 className="size-4 animate-spin" /> : s.saved ? <><Check className="size-4" /> Saved</> : "Save changes"}
          </Button>
        </form>
        {s.nameError ? <p className="mt-2 text-xs text-destructive">{s.nameError}</p> : null}
      </Section>

      {/* Workspace defaults */}
      <Section icon={SlidersHorizontal} title="Workspace defaults"
        description="The country and language new keyword and SERP searches start with, and the timezone used for dates and reports.">
        <form onSubmit={s.saveDefaults} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Default country">
              <Select value={s.country} onValueChange={(v) => s.setCountry((v as string) ?? "in")} disabled={!s.activeWorkspace}>
                <SelectTrigger className="h-10 w-full"><SelectValue>{(v) => labelFor(COUNTRIES, v as string, "Country")}</SelectValue></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Default language">
              <Select value={s.language} onValueChange={(v) => s.setLanguage((v as string) ?? "en")} disabled={!s.activeWorkspace}>
                <SelectTrigger className="h-10 w-full"><SelectValue>{(v) => labelFor(LANGUAGES, v as string, "Language")}</SelectValue></SelectTrigger>
                <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Timezone">
              <Select value={s.timezone} onValueChange={(v) => s.setTimezone((v as string) ?? "UTC")} disabled={!s.activeWorkspace}>
                <SelectTrigger className="h-10 w-full"><SelectValue>{(v) => (v as string) || "UTC"}</SelectValue></SelectTrigger>
                <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={s.savingDefaults || !s.defaultsDirty}>
              {s.savingDefaults ? <Loader2 className="size-4 animate-spin" /> : s.defaultsSaved && !s.defaultsDirty ? <><Check className="size-4" /> Saved</> : "Save defaults"}
            </Button>
            {!s.defaultsDirty && !s.defaultsSaved ? null : null}
          </div>
        </form>
      </Section>

      {/* Create workspace */}
      <Section icon={Plus} title="Create a workspace"
        description="Use one workspace per business or client. Each has its own domains, team and reports — switch between them from the top of the sidebar.">
        <Button onClick={() => setCreatingWs(true)}><Plus className="size-4" /> New workspace</Button>
        <CreateWorkspaceDialog open={creatingWs} onOpenChange={setCreatingWs} />
      </Section>

      <IntegrationsPanel />

      {/* Account */}
      <Section icon={User} title="Account" description="Your personal details.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnly label="Name" value={`${s.user.first_name} ${s.user.last_name}`} />
          <ReadOnly label="Email" value={s.user.email} />
        </div>
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, description, children }: {
  icon: typeof Globe; title: string; description: string; children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  )
}
