"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import MainNav from "@/components/navigation/MainNav"
import ItemPanel from "./ItemPanel"
import type { Roadmap, RoadmapItem } from "@/types/roadmap"

const STATUS_ORDER = ["DISCOVERY", "IN DEV", "READY FOR DEV", "DONE"]

export default function PublicRoadmapView() {
  const searchParams = useSearchParams()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState(
    () => parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  )
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null)
  const [isItemPanelOpen, setIsItemPanelOpen] = useState(false)

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/roadmap/public?year=${year}`)
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Failed to load roadmap" }))
          setError(err.error || "Failed to load roadmap")
          setRoadmap(null)
          return
        }
        const data = await response.json()
        setRoadmap(data)
      } catch {
        setError("Failed to load roadmap")
        setRoadmap(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadRoadmap()
  }, [year])

  const allItems = useMemo(() => roadmap?.sections.flatMap((section) => section.items) ?? [], [roadmap])

  const summary = useMemo(() => {
    const inFlight = allItems.filter((item) => item.status.toLowerCase().includes("dev") || item.status.toLowerCase().includes("progress"))
    const atRisk = allItems.filter((item) => (item.risk || "").toLowerCase() === "high")
    const done = allItems.filter((item) => item.status.toLowerCase() === "done")
    return {
      initiatives: roadmap?.sections.length ?? 0,
      items: allItems.length,
      inFlight: inFlight.length,
      atRisk: atRisk.length,
      done: done.length,
    }
  }, [allItems, roadmap])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading roadmap...</div>
      </div>
    )
  }

  if (error || !roadmap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded border border-red-200 bg-red-50 px-6 py-4 text-red-800">
          {error || "No published roadmap found."}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Thrive Product Roadmap</h1>
            <p className="text-sm text-gray-600">Executive summary of what Product is working on and what is shipping next.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <MainNav />
            <div className="flex items-center gap-2">
              <Label htmlFor="year" className="text-sm">Year:</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || year)}
                className="w-20"
                min="2020"
                max="2100"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-5 px-6 py-6">
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Public view. Updated from the currently published roadmap.
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Initiatives" value={summary.initiatives} />
          <MetricCard label="Items" value={summary.items} />
          <MetricCard label="In Flight" value={summary.inFlight} />
          <MetricCard label="Done" value={summary.done} tone="good" />
        </section>

        <section className="space-y-4">
          {roadmap.sections.map((section) => {
            const orderedItems = [...section.items].sort((a, b) => {
              const aStatus = STATUS_ORDER.indexOf(a.status.toUpperCase())
              const bStatus = STATUS_ORDER.indexOf(b.status.toUpperCase())
              return (aStatus === -1 ? 99 : aStatus) - (bStatus === -1 ? 99 : bStatus)
            })

            return (
              <article key={section.id} className="rounded border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{section.name}</h2>
                {section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}

                <div className="mt-4 space-y-3">
                  {orderedItems.map((item) => (
                    <button
                      key={item.id}
                      className="w-full rounded border border-gray-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => {
                        setSelectedItem(item)
                        setIsItemPanelOpen(true)
                      }}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <Badge>{item.status}</Badge>
                      </div>

                      {item.description && <p className="line-clamp-2 text-sm text-gray-700">{item.description}</p>}

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-700">
                        {item.quarters.map((quarter) => (
                          <span key={quarter.id} className="rounded bg-gray-100 px-2 py-1">Q{quarter.quarter} {quarter.year}</span>
                        ))}
                        {item.jiraLinks && (
                          <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-800">
                            {item.jiraLinks}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {section.items.length === 0 && <p className="text-sm text-gray-500">No items yet.</p>}
                </div>
              </article>
            )
          })}
        </section>
      </main>

      {selectedItem && (
        <ItemPanel
          item={selectedItem}
          isOpen={isItemPanelOpen}
          onClose={() => {
            setIsItemPanelOpen(false)
            setSelectedItem(null)
          }}
          onSave={async () => {}}
          year={year}
          isAdmin={false}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warn" | "good" }) {
  const toneClass = tone === "warn"
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-gray-200 bg-white text-gray-900"

  return (
    <div className={`rounded border px-4 py-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" }) {
  const classes = tone === "warn"
    ? "bg-amber-100 text-amber-800"
    : "bg-gray-100 text-gray-700"

  return <span className={`rounded px-2 py-0.5 text-xs ${classes}`}>{children}</span>
}
