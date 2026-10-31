import { redirect } from "next/navigation"

// Page score is now the per-page detail of the unified Page Audit page.
export default function Page() {
  redirect("/dashboard/page-audit")
}
