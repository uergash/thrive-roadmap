"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import MainNav from "@/components/navigation/MainNav"
import type { FeedbackEntry } from "@/types/insights"

interface GroupedFeedback {
  theme: string
  items: FeedbackEntry[]
}

export default function PublicFeedbackView() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/feedback/public?days=60")
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Failed to load feedback" }))
          setError(payload.error || "Failed to load feedback")
          return
        }

        const payload = await response.json()
        setEntries(payload)
      } catch {
        setError("Failed to load feedback")
      } finally {
        setIsLoading(false)
      }
    }

    loadFeedback()
  }, [])

  const grouped = useMemo<GroupedFeedback[]>(() => {
    const map = new Map<string, FeedbackEntry[]>()
    for (const entry of entries) {
      const key = entry.theme?.name || "Uncategorized"
      const list = map.get(key) ?? []
      list.push(entry)
      map.set(key, list)
    }

    return Array.from(map.entries())
      .map(([theme, items]) => ({ theme, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [entries])

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading recent feedback...</div>
  }

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Recent Product Feedback</h1>
          <MainNav />
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="mb-5 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Feedback from the last 60 days, grouped by theme, with links to roadmap items this input is influencing.
        </div>

        {grouped.length === 0 && (
          <div className="rounded border bg-white p-6 text-gray-600">No published feedback entries yet.</div>
        )}

        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.theme} className="rounded border bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-lg font-semibold">{group.theme}</h2>
              <p className="mb-4 text-sm text-gray-600">{group.items.length} feedback signal{group.items.length === 1 ? "" : "s"}</p>

              <div className="space-y-3">
                {group.items.map((entry) => (
                  <article key={entry.id} className="rounded border border-gray-200 p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">{entry.title}</h3>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{entry.source}</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Urgency {entry.urgency}/5</span>
                    </div>

                    <p className="mb-2 text-sm text-gray-700">{entry.summary}</p>

                    <div className="text-xs text-gray-600">
                      Received {new Date(entry.receivedAt).toLocaleDateString()} {entry.customerSegment ? `• Segment: ${entry.customerSegment}` : ""}
                    </div>

                    {entry.roadmapLinks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {entry.roadmapLinks.map((link) => (
                          <span key={`${entry.id}-${link.itemId}`} className="rounded bg-blue-100 px-2 py-1 text-blue-800">
                            Linked roadmap: {link.item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
