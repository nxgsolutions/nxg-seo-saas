import { Suspense } from "react"

import PageAuditPage from "./_components/page-audit-screen"

// Reads ?audit= / ?url= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <PageAuditPage />
    </Suspense>
  )
}
