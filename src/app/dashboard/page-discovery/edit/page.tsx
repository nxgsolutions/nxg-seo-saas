import { Suspense } from "react"

import ContentEditorScreen from "../_components/content-editor-screen"

// Reads ?page=<id> (useSearchParams), so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <ContentEditorScreen />
    </Suspense>
  )
}
