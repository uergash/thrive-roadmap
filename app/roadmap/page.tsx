import { Suspense } from "react"
import RoadmapHubView from "@/components/roadmap/RoadmapHubView"

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RoadmapHubView />
    </Suspense>
  )
}
