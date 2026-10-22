import { Suspense } from "react"

import PageDetailScreen from "../_components/page-detail-screen"

// Reads ?url= / ?target= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <PageDetailScreen />
    </Suspense>
  )
}
