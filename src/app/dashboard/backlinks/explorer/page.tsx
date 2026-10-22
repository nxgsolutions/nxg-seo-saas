import { Suspense } from "react"

import ExplorerScreen from "../_components/explorer-screen"

// Reads ?target= (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <ExplorerScreen />
    </Suspense>
  )
}
