/**
 * Build a self-contained, print-ready HTML report for a saved page audit.
 * No external assets — inline CSS only — so the downloaded file opens anywhere
 * and prints cleanly (Save as PDF).
 */
import { brand } from "@/config/brand"
import type { AuditDetail } from "@/lib/api/audits"

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}

const STATUS = {
  pass: { color: "#10b981", label: "Pass" },
  warn: { color: "#f59e0b", label: "Warning" },
  fail: { color: "#ef4444", label: "Fail" },
} as const

function tagRow(label: string, value: string): string {
  return `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value) || "—"}</td></tr>`
}

function boolRow(label: string, present: boolean): string {
  const c = present ? "#10b981" : "#94a3b8"
  const t = present ? "Present" : "Missing"
  return `<tr><td class="k">${esc(label)}</td><td class="v" style="color:${c};font-weight:600">${t}</td></tr>`
}

export function buildAuditReportHtml(result: AuditDetail): string {
  const m = result.metrics
  const pass = result.checks.filter((c) => c.status === "pass").length
  const warn = result.checks.filter((c) => c.status === "warn").length
  const fail = result.checks.filter((c) => c.status === "fail").length
  const color = scoreColor(result.score)
  const generated = new Date().toLocaleString()
  const audited = new Date(result.created_at).toLocaleString()
  const device = (m.device as string) ?? "desktop"

  const checksHtml = result.checks
    .map((c) => {
      const s = STATUS[c.status]
      return `<tr>
        <td><span class="dot" style="background:${s.color}"></span></td>
        <td class="label">${esc(c.label)}<div class="detail">${esc(c.detail)}</div></td>
        <td class="status" style="color:${s.color}">${s.label}</td>
      </tr>`
    })
    .join("")

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page Audit — ${esc(result.url)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 32px 24px 64px; }
  .top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
  .brand { font-size: 20px; font-weight: 800; color: #1d4ed8; letter-spacing: -.02em; }
  .muted { color: #64748b; }
  .sub { font-size: 12px; }
  h1 { font-size: 20px; margin: 24px 0 4px; }
  .url { color: #1d4ed8; word-break: break-all; }
  .hero { display: flex; gap: 28px; align-items: center; margin: 24px 0; padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
  .gauge { position: relative; width: 120px; height: 120px; flex: 0 0 auto; }
  .gauge .num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge .num b { font-size: 34px; color: ${color}; }
  .gauge .num span { font-size: 11px; color: #94a3b8; }
  .pills span { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
  .metrics .cell { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; }
  .metrics .cell small { color: #64748b; }
  .metrics .cell b { display: block; font-size: 16px; }
  h2 { font-size: 15px; margin: 28px 0 8px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  td { padding: 10px 12px; border-top: 1px solid #eef2f7; vertical-align: top; }
  tr:first-child td { border-top: 0; }
  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
  .label { font-weight: 600; }
  .detail { font-weight: 400; color: #64748b; margin-top: 2px; }
  .status { text-align: right; font-weight: 700; white-space: nowrap; }
  .tags td.k { color: #64748b; width: 42%; }
  .tags td.v { font-weight: 600; word-break: break-word; }
  .foot { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
  @media print { body { background: #fff; } .hero, table { break-inside: avoid; } }
</style></head>
<body><div class="wrap">
  <div class="top">
    <div class="brand">${esc(brand.name)}</div>
    <div class="muted sub">Page Audit Report<br>Generated ${esc(generated)}</div>
  </div>

  <h1>Page Audit</h1>
  <div class="url">${esc(result.url)}</div>
  <div class="muted sub">Audited ${esc(audited)} · HTTP ${esc(result.status_code)} · ${esc(device)}</div>

  <div class="hero">
    <div class="gauge">
      <svg width="120" height="120" viewBox="0 0 120 120" style="transform:rotate(-90deg)">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="10"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52 * (1 - result.score / 100)}"/>
      </svg>
      <div class="num"><b>${result.score}</b><span>/ 100</span></div>
    </div>
    <div style="flex:1">
      <div class="pills">
        <span style="background:#ecfdf5;color:#059669">${pass} passed</span>
        <span style="background:#fffbeb;color:#d97706">${warn} warnings</span>
        <span style="background:#fef2f2;color:#dc2626">${fail} failed</span>
      </div>
      <div class="metrics">
        <div class="cell"><small>HTML fetch time</small><b>${esc(result.load_time_ms)} ms</b></div>
        <div class="cell"><small>Words</small><b>${esc(m.word_count)}</b></div>
        <div class="cell"><small>Links</small><b>${esc((m.internal_links ?? 0) + (m.external_links ?? 0))}</b></div>
        <div class="cell"><small>HTML size</small><b>${Math.round(result.page_size_bytes / 1024)} KB</b></div>
      </div>
    </div>
  </div>

  <h2>SEO &amp; performance checks</h2>
  <table>${checksHtml}</table>

  <p class="muted">${esc(m.audit_scope)}</p>
  ${m.findings ? `<h2>Prioritized fixes</h2><table>${m.findings.map(f => `<tr><td>${esc(f.priority)} · ${esc(f.label)}<p>${esc(f.evidence)}</p><strong>How to fix:</strong> ${esc(f.fix)}</td></tr>`).join("")}</table>` : ""}
  ${m.image_details ? `<h2>Image review</h2><p>Image bytes and rendered dimensions not measured.${m.image_details_truncated ? " Showing the first 200 images." : ""}</p><table>${m.image_details.map(i => `<tr><td>Image ${i.position}<p>${esc(i.src)}</p>Alt: ${esc(i.alt === null ? "Missing" : i.alt || "Empty (decorative)")}<ul>${i.fixes.map(f => `<li>${esc(f)}</li>`).join("")}</ul></td></tr>`).join("")}</table>` : ""}
  <h2>Tags &amp; metadata</h2>
  <table class="tags">
    ${tagRow("Device", device)}
    ${tagRow("Language", (m.lang as string) || "")}
    ${tagRow("Title", (m.title as string) || "")}
    ${tagRow("Meta description", (m.description as string) || "")}
    ${tagRow("Canonical URL", (m.canonical_url as string) || "")}
    ${tagRow("Charset", (m.charset as string) || "")}
    ${tagRow("H2 headings", String(m.h2_count ?? 0))}
    ${tagRow("hreflang tags", String(m.hreflang_count ?? 0))}
    ${boolRow("Open Graph title", !!m.og_title)}
    ${boolRow("Open Graph image", !!m.og_image)}
    ${boolRow("Twitter card", !!m.has_twitter_card)}
    ${boolRow("Structured data (JSON-LD)", !!m.has_structured_data)}
    ${boolRow("Favicon", !!m.has_favicon)}
  </table>

  <div class="foot">Report generated by ${esc(brand.name)} · ${esc(brand.tagline)}</div>
</div></body></html>`
}

/** Trigger a download of the report as a standalone .html file. */
export function downloadAuditReport(result: AuditDetail): void {
  const html = buildAuditReportHtml(result)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const host = result.url.replace(/^https?:\/\//, "").replace(/[^a-z0-9.-]+/gi, "-").slice(0, 40)
  const date = new Date(result.created_at).toISOString().slice(0, 10)
  const a = document.createElement("a")
  a.href = url
  a.download = `page-audit-${host}-${date}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
