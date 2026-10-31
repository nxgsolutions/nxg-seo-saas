import { redirect } from "next/navigation"

// The Fix plan is now the "Fix first" tab of the unified Page Audit page.
export default function Page() {
  redirect("/dashboard/page-audit")
}
