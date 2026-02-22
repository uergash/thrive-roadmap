"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import MainNav from "@/components/navigation/MainNav"
import type { Concept } from "@/types/insights"

const STAGE_LABELS: Record<Concept["stage"], string> = {
  EXPLORING: "Exploring",
  VALIDATING: "Validating",
  PLANNED: "Planned",
}

export default function PublicConceptsView() {
  const { data: session } = useSession()
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConcepts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/concepts/public")
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: "Failed to load concepts" }))
          setError(payload.error || "Failed to load concepts")
          return
        }

        const payload = await response.json()
        setConcepts(payload)
      } catch {
        setError("Failed to load concepts")
      } finally {
        setIsLoading(false)
      }
    }

    loadConcepts()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-center text-gray-600">Loading concepts...</div>
  }

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Future Concepts</h1>
          <div className="flex items-center gap-4">
            <MainNav />
            {session?.user?.role === "ADMIN" && (
              <Link href="/concepts/edit" className="text-sm text-blue-700 hover:underline">
                Edit Concepts
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="mb-5 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Concepts show what Product is exploring next and which current initiatives they connect to.
        </div>

        {concepts.length === 0 && (
          <div className="rounded border bg-white p-6 text-gray-600">No published concepts yet.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {concepts.map((concept) => (
            <article
              key={concept.id}
              className="h-[360px] cursor-pointer [perspective:1200px]"
              onClick={() => setFlippedIds((prev) => ({ ...prev, [concept.id]: !prev[concept.id] }))}
            >
              <div
                className={`relative h-full w-full rounded border shadow-sm transition-transform duration-500 [transform-style:preserve-3d] ${
                  flippedIds[concept.id] ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                <div className="absolute inset-0 rounded bg-white [backface-visibility:hidden]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={concept.artifactUrl}
                    alt={concept.title}
                    className="h-44 w-full rounded-t object-cover"
                  />
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold">{concept.title}</h2>
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{STAGE_LABELS[concept.stage]}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-gray-700">{concept.problem}</p>
                    <p className="mt-3 text-xs text-gray-500">Click card for details</p>
                  </div>
                </div>

                <div className="absolute inset-0 rounded bg-white p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <h2 className="mb-2 text-base font-semibold">{concept.title}</h2>
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">{STAGE_LABELS[concept.stage]}</p>
                  <p className="mb-2 text-sm text-gray-700"><strong>What it does:</strong> {concept.problem}</p>
                  <p className="mb-3 text-sm text-gray-700"><strong>How it works:</strong> {concept.hypothesis}</p>

                  <div className="mb-2 text-xs text-gray-600">
                    {concept.owner ? `Owner: ${concept.owner}` : "Owner: Unassigned"}
                    {concept.decisionDate ? ` • Decision target: ${new Date(concept.decisionDate).toLocaleDateString()}` : ""}
                  </div>

                  <div className="mb-3 text-sm">
                    <a href={concept.artifactUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                      {concept.artifactLabel || "Open image/prototype"}
                    </a>
                  </div>

                  {concept.roadmapLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {concept.roadmapLinks.map((link) => (
                        <span key={`${concept.id}-${link.itemId}`} className="rounded bg-blue-100 px-2 py-1 text-blue-800">
                          {link.item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
