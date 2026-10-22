import { Suspense } from "react"

import SiteDetailScreen from "../_components/site-detail-screen"

// Reads ?host= / ?target= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <SiteDetailScreen />
    </Suspense>
  )
}
