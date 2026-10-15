import { Suspense } from "react"

import PageHistoryPage from "./_components/page-history-screen"

// Reads ?page= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <PageHistoryPage />
    </Suspense>
  )
}
