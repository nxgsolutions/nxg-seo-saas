/** Normalize fetched page HTML before it seeds the content editor.
 *
 * Extracted article HTML often carries presentational bold — whole paragraphs
 * wrapped in <b>/<strong>, or inline font-weight styles. In a contentEditable
 * surface the caret inherits that formatting, so the user's very first keystroke
 * comes out bold ("auto-bold"). This strips the stray bold (keeping genuine
 * structure and emphasis like <em>/<i>) and appends a clean trailing paragraph
 * so there is always a normal-weight spot for the caret to land. */
export function cleanEditorHtml(html: string): string {
  // DOMParser is browser-only; the editor seeds this inside a layout effect, but
  // guard anyway so the helper is safe to import/call elsewhere.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html || "<p><br></p>"
  }

  const doc = new DOMParser().parseFromString(html || "", "text/html")
  const body = doc.body

  // 1. Unwrap presentational bold tags, replacing each with its own children.
  body.querySelectorAll("b, strong, font").forEach((el) => {
    const parent = el.parentNode
    if (!parent) return
    while (el.firstChild) parent.insertBefore(el.firstChild, el)
    parent.removeChild(el)
  })

  // 2. Drop font-weight from inline styles (and remove the attr if left empty).
  body.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const cleaned = el.style.cssText
      .split(";")
      .filter((d) => d.trim() && !/^\s*font-weight\s*:/i.test(d))
      .join(";")
    if (cleaned.trim()) el.setAttribute("style", cleaned)
    else el.removeAttribute("style")
  })

  // 3. Always end on a clean, non-bold paragraph for the caret to land in.
  const tail = doc.createElement("p")
  tail.appendChild(doc.createElement("br"))
  body.appendChild(tail)

  return body.innerHTML
}
