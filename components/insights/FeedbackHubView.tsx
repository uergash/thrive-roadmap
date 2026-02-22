"use client"

import { useSession } from "next-auth/react"
import FeedbackEditorView from "@/components/insights/FeedbackEditorView"

export default function FeedbackHubView() {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return <FeedbackEditorView />
  }

  return <FeedbackEditorView />
}
