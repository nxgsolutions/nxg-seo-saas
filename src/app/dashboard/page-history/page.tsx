import { redirect } from "next/navigation"

// Page history is now the "History" tab of the unified Page Audit page.
export default function Page() {
  redirect("/dashboard/page-audit")
}
