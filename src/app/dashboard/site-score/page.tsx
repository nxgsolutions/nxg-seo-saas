import { redirect } from "next/navigation"

// Site score now lives at the top of the unified Page Audit page.
export default function Page() {
  redirect("/dashboard/page-audit")
}
