import { Suspense } from "react"
import PublicConceptsView from "@/components/insights/PublicConceptsView"

export default function ConceptsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <PublicConceptsView />
    </Suspense>
  )
}
