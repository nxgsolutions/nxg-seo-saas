import { Suspense } from "react"

import MetaTagsPage from "./_components/meta-tags-screen"

// Reads ?url= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <MetaTagsPage />
    </Suspense>
  )
}
