"use client"

import { useSession } from "next-auth/react"
import ConceptsEditorView from "@/components/insights/ConceptsEditorView"

export default function ConceptsHubView() {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated") {
    return <ConceptsEditorView />
  }

  return <ConceptsEditorView />
}
