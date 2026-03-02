"use client"

import { useSession } from "next-auth/react"
import PublicRoadmapView from "@/components/roadmap/PublicRoadmapView"
import TimelineView from "@/components/roadmap/TimelineView"

export default function RoadmapHubView() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (status === "authenticated" && session?.user?.role === "ADMIN") {
    return <TimelineView />
  }

  return <PublicRoadmapView />
}
