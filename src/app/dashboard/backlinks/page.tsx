import { Suspense } from "react"

import BacklinkOverviewPage from "./_components/backlink-profile-screen"

// Reads ?target= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <BacklinkOverviewPage />
    </Suspense>
  )
}
