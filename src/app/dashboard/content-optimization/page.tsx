import { Suspense } from "react"

import ContentOptimizationPage from "./_components/content-optimization-screen"

// The screen reads ?session= / ?url= / ?keyword= (useSearchParams), so it
// renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <ContentOptimizationPage />
    </Suspense>
  )
}
