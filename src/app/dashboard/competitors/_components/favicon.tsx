"use client"

export function Favicon({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
      alt="" width={18} height={18} className="size-[18px] shrink-0 rounded-sm"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }}
    />
  )
}
