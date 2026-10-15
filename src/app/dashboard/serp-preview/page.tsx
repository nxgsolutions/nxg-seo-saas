import { Suspense } from "react"

import SerpPreviewPage from "./_components/serp-preview-screen"

// Reads ?url= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <SerpPreviewPage />
    </Suspense>
  )
}
