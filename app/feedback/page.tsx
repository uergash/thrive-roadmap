import { Suspense } from "react"
import FeedbackHubView from "@/components/insights/FeedbackHubView"

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <FeedbackHubView />
    </Suspense>
  )
}
