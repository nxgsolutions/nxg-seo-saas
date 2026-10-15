"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2, UserPlus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTeamScreen } from "../_hooks/use-team-screen"

export default function TeamPage() {
  const { user, activeWorkspace, members, loading, canManage, inviting, setInviting, email, setEmail, role, setRole, submitting, error, setError, removingId, invite, remove, changeRole } = useTeamScreen()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={<> Team </>} description={<> People in {activeWorkspace?.name ?? "this workspace"}. </>} />
        {canManage ? (
          <Button onClick={() => setInviting((v) => !v)}>
            <UserPlus className="size-4" /> Add member
          </Button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {inviting && canManage ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add a member</CardTitle>
                <CardDescription>
                  Add an existing account by email. They&apos;ll get access to this
                  workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="member-email">Email</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={email}
                      onValueChange={(v) => {
                        setEmail(v)
                        if (error) setError(null)
                      }}
                      placeholder="teammate@company.com"
                      disabled={submitting}
                      aria-invalid={!!error}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="member-role">Role</Label>
                    <select
                      id="member-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={submitting}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="sm:w-28">
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Add"}
                  </Button>
                </form>
                {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members{members.length ? ` (${members.length})` : ""}
          </CardTitle>
          <CardDescription>
            Roles determine what each person can do in the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const isOwner = m.role === "owner"
                const isSelf = m.user_id === user.id
                return (
                  <li key={m.user_id} className="flex items-center gap-3 px-6 py-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {(m.first_name[0] ?? "").toUpperCase()}
                      {(m.last_name[0] ?? "").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.first_name} {m.last_name}
                        {isSelf ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            (you)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                    {canManage && !isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.user_id, e.target.value)}
                        aria-label={`Role for ${m.first_name}`}
                        className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <Badge variant={isOwner ? "primary" : "default"} className="capitalize">
                        {m.role}
                      </Badge>
                    )}
                    {canManage && !isOwner ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(m.user_id)}
                        disabled={removingId === m.user_id}
                        aria-label={`Remove ${m.first_name}`}
                        title="Remove member"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {removingId === m.user_id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    ) : (
                      <span className="size-7" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
