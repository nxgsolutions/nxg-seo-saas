"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import * as React from "react"
import { LANGUAGES, LOCATIONS } from "../_lib/keyword-analysis-helpers"

export function SearchBar(props: {
  value: string
  onChange: (v: string) => void
  language: string
  setLanguage: (v: string) => void
  location: string
  setLocation: (v: string) => void
  loading: boolean
  placeholder: string
  label: string
  icon: React.ReactNode
  onSubmit: (e?: React.FormEvent) => void
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={props.onSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{props.label}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{props.icon}</span>
              <Input value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="h-10 pl-9" disabled={props.loading} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Language</label>
            <Select value={props.language} onValueChange={(v) => props.setLanguage(v ?? "en")} disabled={props.loading}>
              <SelectTrigger className="h-10 w-full lg:w-36"><SelectValue>{(v) => LANGUAGES.find((l) => l.code === v)?.label ?? "Language"}</SelectValue></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => (<SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
            <Select value={props.location} onValueChange={(v) => props.setLocation(v ?? "in")} disabled={props.loading}>
              <SelectTrigger className="h-10 w-full lg:w-40"><SelectValue>{(v) => LOCATIONS.find((l) => l.code === v)?.label ?? "Location"}</SelectValue></SelectTrigger>
              <SelectContent>{LOCATIONS.map((l) => (<SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <Button type="submit" size="lg" disabled={props.loading}>
            {props.loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
