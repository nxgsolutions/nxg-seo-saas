/**
 * Build a consolidated, print-ready HTML report for a domain — combining the
 * latest page audit with Google Search Console performance and top keywords.
 * Self-contained (inline CSS), so it opens anywhere and prints cleanly to PDF.
 */
import { brand } from "@/config/brand"
import type { AuditDetail } from "@/lib/api/audits"
import type { GscKeywordPerformance } from "@/lib/api/gsc"

export interface SiteReportData {
  domain: string
  audit: AuditDetail | null
  gsc: GscKeywordPerformance | null
  gscSample: boolean
}

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

function auditSection(audit: AuditDetail | null): string {
  if (!audit) {
    return `<h2>Page audit</h2><p class="muted">No audit found for this site. Run a Page Audit to include it.</p>`
  }
  const pass = audit.checks.filter((c) => c.status === "pass").length
  const warn = audit.checks.filter((c) => c.status === "warn").length
  const fail = audit.checks.filter((c) => c.status === "fail").length
  const color = scoreColor(audit.score)
  const issues = audit.checks
    .filter((c) => c.status !== "pass")
    .map(
      (c) =>
        `<tr><td class="label">${esc(c.label)}<div class="detail">${esc(c.detail)}</div></td>
         <td class="status" style="color:${c.status === "fail" ? "#ef4444" : "#f59e0b"}">${c.status === "fail" ? "Fail" : "Warn"}</td></tr>`
    )
    .join("")
  return `
  <h2>Page audit</h2>
  <div class="hero">
    <div class="gauge">
      <svg width="110" height="110" viewBox="0 0 120 120" style="transform:rotate(-90deg)">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="10"/>
        <circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${2 * Math.PI * 52}" stroke-dashoffset="${2 * Math.PI * 52 * (1 - audit.score / 100)}"/>
      </svg>
      <div class="num"><b style="color:${color}">${audit.score}</b><span>/ 100</span></div>
    </div>
    <div style="flex:1">
      <div class="url">${esc(audit.url)}</div>
      <div class="pills" style="margin-top:8px">
        <span style="background:#ecfdf5;color:#059669">${pass} passed</span>
        <span style="background:#fffbeb;color:#d97706">${warn} warnings</span>
        <span style="background:#fef2f2;color:#dc2626">${fail} failed</span>
      </div>
    </div>
  </div>
  ${issues ? `<h3>Issues to fix</h3><table>${issues}</table>` : `<p class="muted">No issues — every check passed.</p>`}`
}

function gscSection(gsc: GscKeywordPerformance | null, sample: boolean): string {
  if (!gsc) return ""
  const d = gsc.distribution
  const rows = gsc.keywords
    .slice(0, 25)
    .map(
      (k) =>
        `<tr><td class="label">${esc(k.keyword)}</td>
         <td class="num-cell">${Math.round(k.clicks).toLocaleString()}</td>
         <td class="num-cell">${Math.round(k.impressions).toLocaleString()}</td>
         <td class="num-cell">${(k.ctr * 100).toFixed(1)}%</td>
         <td class="num-cell">${k.position.toFixed(1)}</td></tr>`
    )
    .join("")
  return `
  <h2>Search performance ${sample ? '<span class="badge">sample</span>' : ""}</h2>
  <div class="metrics">
    <div class="cell"><small>Ranking keywords</small><b>${gsc.keyword_count.toLocaleString()}</b></div>
    <div class="cell"><small>Clicks</small><b>${Math.round(gsc.total_clicks).toLocaleString()}</b></div>
    <div class="cell"><small>Impressions</small><b>${Math.round(gsc.total_impressions).toLocaleString()}</b></div>
    <div class="cell"><small>Avg position</small><b>${gsc.avg_position.toFixed(1)}</b></div>
  </div>
  <h3>Rank distribution</h3>
  <div class="dist">
    <span style="background:#10b981">1–3: ${d.top3}</span>
    <span style="background:#3b82f6">4–10: ${d.top10}</span>
    <span style="background:#f59e0b">11–20: ${d.top20}</span>
    <span style="background:#94a3b8">21+: ${d.beyond}</span>
  </div>
  <h3>Top keywords</h3>
  <table>
    <tr class="head"><td>Keyword</td><td class="num-cell">Clicks</td><td class="num-cell">Impr.</td><td class="num-cell">CTR</td><td class="num-cell">Pos.</td></tr>
    ${rows}
  </table>`
}

export function buildSiteReportHtml(data: SiteReportData): string {
  const generated = new Date().toLocaleString()
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEO Report — ${esc(data.domain)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }
  .top { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
  .brand { font-size: 20px; font-weight: 800; color: #1d4ed8; letter-spacing: -.02em; }
  .muted { color: #64748b; }
  .sub { font-size: 12px; }
  h1 { font-size: 22px; margin: 24px 0 2px; }
  h2 { font-size: 16px; margin: 30px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  h3 { font-size: 13px; margin: 18px 0 6px; color: #334155; }
  .url { color: #1d4ed8; word-break: break-all; font-weight: 600; }
  .hero { display: flex; gap: 24px; align-items: center; margin: 12px 0; padding: 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
  .gauge { position: relative; width: 110px; height: 110px; flex: 0 0 auto; }
  .gauge .num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .gauge .num b { font-size: 32px; }
  .gauge .num span { font-size: 11px; color: #94a3b8; }
  .pills span, .dist span { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; color:#fff; }
  .pills span { color: inherit; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .metrics .cell { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background:#fff; }
  .metrics .cell small { color: #64748b; }
  .metrics .cell b { display: block; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  td { padding: 8px 12px; border-top: 1px solid #eef2f7; vertical-align: top; }
  tr:first-child td { border-top: 0; }
  .head td { font-size: 11px; text-transform: uppercase; color: #64748b; background: #f8fafc; }
  .label { font-weight: 600; }
  .detail { font-weight: 400; color: #64748b; margin-top: 2px; }
  .status { text-align: right; font-weight: 700; white-space: nowrap; }
  .num-cell { text-align: right; white-space: nowrap; }
  .badge { font-size: 11px; background:#eff6ff; color:#2563eb; padding:2px 8px; border-radius:999px; vertical-align: middle; }
  .foot { margin-top: 36px; font-size: 12px; color: #94a3b8; text-align: center; }
  @media print { body { background: #fff; } .hero, table, .metrics { break-inside: avoid; } }
</style></head>
<body><div class="wrap">
  <div class="top">
    <div class="brand">${esc(brand.name)}</div>
    <div class="muted sub">SEO Report<br>Generated ${esc(generated)}</div>
  </div>
  <h1>${esc(data.domain)}</h1>
  <div class="muted sub">Combined audit &amp; search performance report</div>
  ${auditSection(data.audit)}
  ${gscSection(data.gsc, data.gscSample)}
  <div class="foot">Report generated by ${esc(brand.name)} · ${esc(brand.tagline)}</div>
</div></body></html>`
}

export function downloadSiteReport(data: SiteReportData): void {
  const html = buildSiteReportHtml(data)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const safe = data.domain.replace(/[^a-z0-9.-]+/gi, "-").slice(0, 40)
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement("a")
  a.href = url
  a.download = `seo-report-${safe}-${date}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Open the report in a new tab and trigger the print dialog (Save as PDF). */
export function printSiteReport(data: SiteReportData): void {
  const html = buildSiteReportHtml(data)
  const w = window.open("", "_blank")
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}
