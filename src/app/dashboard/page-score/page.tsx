import { Suspense } from "react"

import PageScorePage from "./_components/page-score-screen"

// Reads ?url= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <PageScorePage />
    </Suspense>
  )
}
