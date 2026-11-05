"use client"

/** Site favicon. `size` is the rendered pixel size; the image is fetched at a
 *  higher resolution (sz=64) so it stays crisp when shown larger. */
export function Favicon({ domain, size = 18 }: { domain: string; size?: number }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-sm"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }}
    />
  )
}
