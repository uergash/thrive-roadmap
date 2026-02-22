"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import MainNav from "@/components/navigation/MainNav"
import Section from "./Section"
import ItemPanel from "./ItemPanel"
import { Plus, LogOut, Users, X, Camera, SlidersHorizontal } from "lucide-react"
import { Label } from "@/components/ui/label"
import { signOut } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Roadmap, Section as SectionType, RoadmapItem } from "@/types/roadmap"

const QUARTERS = [1, 2, 3, 4] as const
const DEFAULT_HEALTH_OPTIONS = ["Not started", "On track", "At risk", "Delayed"] as const
const DEFAULT_PROGRESS_OPTIONS = [
  "Not started",
  "Discovery",
  "Design",
  "Planning",
  "Development",
  "Released",
] as const

export default function TimelineView() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [isCreatingSection, setIsCreatingSection] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null)
  const [isItemPanelOpen, setIsItemPanelOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [columns, setColumns] = useState<
    Array<
      | { name: string; type: "quarter"; order: number; quarter: number }
      | { name: string; type: "custom"; order: number }
    >
  >([
    { name: "Q1", type: "quarter", order: 0, quarter: 1 },
    { name: "Q2", type: "quarter", order: 1, quarter: 2 },
    { name: "Q3", type: "quarter", order: 2, quarter: 3 },
    { name: "Q4", type: "quarter", order: 3, quarter: 4 },
  ])
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null)
  const [editingColumnValue, setEditingColumnValue] = useState<string>("")
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false)
  const [snapshotName, setSnapshotName] = useState("")
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null)
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null)
  const [showDetailedQuarterMatrix, setShowDetailedQuarterMatrix] = useState(false)
  const [analyticsQuarterScope, setAnalyticsQuarterScope] = useState<"all" | number>("all")
  const [quarterFilter, setQuarterFilter] = useState<"all" | "1" | "2" | "3" | "4">("all")
  const [healthFilter, setHealthFilter] = useState<string>("all")
  const [progressFilter, setProgressFilter] = useState<string>("all")
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
  const filterPopoverRef = useRef<HTMLDivElement | null>(null)

  const allItems = useMemo(
    () => roadmap?.sections.flatMap((section) => section.items) ?? [],
    [roadmap]
  )

  const healthFilterOptions = useMemo(() => {
    const dynamic = Array.from(new Set(allItems.map((item) => item.risk).filter((risk): risk is string => Boolean(risk))))
    return Array.from(new Set([...DEFAULT_HEALTH_OPTIONS, ...dynamic]))
  }, [allItems])

  const progressFilterOptions = useMemo(() => {
    const dynamic = Array.from(new Set(allItems.map((item) => item.status).filter(Boolean)))
    return Array.from(new Set([...DEFAULT_PROGRESS_OPTIONS, ...dynamic]))
  }, [allItems])

  const tableFilteredSections = useMemo(() => {
    if (!roadmap) return []

    return roadmap.sections
      .map((section) => {
        const filteredItems = section.items.filter((item) => {
          const quarterMatch =
            quarterFilter === "all" ||
            item.quarters.some((q) => q.year === year && q.quarter === Number(quarterFilter))
          const healthMatch =
            healthFilter === "all" ||
            (healthFilter === "__none__" ? !item.risk : item.risk === healthFilter)
          const progressMatch =
            progressFilter === "all" || item.status === progressFilter
          return quarterMatch && healthMatch && progressMatch
        })

        return { ...section, items: filteredItems }
      })
      .filter((section) => section.items.length > 0)
  }, [roadmap, quarterFilter, healthFilter, progressFilter, year])

  const tableFilteredItems = useMemo(
    () => tableFilteredSections.flatMap((section) => section.items),
    [tableFilteredSections]
  )

  const kpiMetrics = useMemo(() => {
    const scopedItems =
      analyticsQuarterScope === "all"
        ? allItems
        : allItems.filter((item) =>
            item.quarters.some((q) => q.year === year && q.quarter === analyticsQuarterScope)
          )
    const onTrackCount = scopedItems.filter((item) => item.risk === "On track").length
    const inDevelopmentCount = scopedItems.filter((item) => item.status === "Development").length
    const atRiskCount = scopedItems.filter((item) => item.risk === "At risk" || item.risk === "Delayed").length
    const discoveryAndDesignCount = scopedItems.filter(
      (item) => item.status === "Discovery" || item.status === "Design"
    ).length

    return {
      onTrackCount,
      inDevelopmentCount,
      atRiskCount,
      discoveryAndDesignCount,
    }
  }, [allItems, analyticsQuarterScope, year])

  const analyticsByQuarter = useMemo(() => {
    const result: Record<
      number,
      {
        total: number
        onTrack: number
        atRisk: number
        delayed: number
        development: number
        released: number
      }
    > = {}

    for (const quarter of QUARTERS) {
      const quarterItems = allItems.filter((item) =>
        item.quarters.some((q) => q.year === year && q.quarter === quarter)
      )

      result[quarter] = {
        total: quarterItems.length,
        onTrack: quarterItems.filter((item) => item.risk === "On track").length,
        atRisk: quarterItems.filter((item) => item.risk === "At risk").length,
        delayed: quarterItems.filter((item) => item.risk === "Delayed").length,
        development: quarterItems.filter((item) => item.status === "Development").length,
        released: quarterItems.filter((item) => item.status === "Released").length,
      }
    }

    return result
  }, [allItems, year])

  const isFilterActive =
    quarterFilter !== "all" || healthFilter !== "all" || progressFilter !== "all"

  const isAdmin = session?.user?.role === "ADMIN"
  const showAdminControls = isAdmin && !isPreviewMode
  const gridTemplateColumns = useMemo(
    () =>
      showAdminControls
        ? `minmax(280px, 2fr) 140px 120px repeat(${columns.length}, minmax(92px, 1fr)) 44px`
        : `minmax(280px, 2fr) 140px 120px repeat(${columns.length}, minmax(92px, 1fr))`,
    [showAdminControls, columns.length]
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchRoadmap()
    }
  }, [status, year, router])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!isFilterPopoverOpen) return
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterPopoverOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isFilterPopoverOpen])

  const fetchRoadmap = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const response = await fetch(`/api/roadmap?year=${year}`, {
        credentials: "include",
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setRoadmap(data)
      } else {
        const errMsg = (data.error as string) || "Failed to fetch roadmap"
        const hint = data.hint as string | undefined
        setLoadError(hint ? `${errMsg} ${hint}` : errMsg)
        toast({
          title: "Error",
          description: hint ? `${errMsg} ${hint}` : errMsg,
          variant: "destructive",
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred while fetching roadmap"
      setLoadError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roadmap || !newSectionName.trim()) return

    setIsCreatingSection(true)
    try {
      const response = await fetch("/api/roadmap/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roadmapId: roadmap.id,
          name: newSectionName,
        }),
      })

      if (response.ok) {
        const newSection = await response.json()
        setRoadmap({
          ...roadmap,
          sections: [...roadmap.sections, newSection],
        })
        setIsAddingSection(false)
        setNewSectionName("")
        toast({
          title: "Success",
          description: "Section created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating section",
        variant: "destructive",
      })
    } finally {
      setIsCreatingSection(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? All items in this section will also be deleted.")) {
      return
    }

    try {
      const response = await fetch(
        `/api/roadmap/sections?sectionId=${sectionId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        setRoadmap({
          ...roadmap!,
          sections: roadmap!.sections.filter((s) => s.id !== sectionId),
        })
        toast({
          title: "Success",
          description: "Section deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting section",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRoadmap = (updatedSections: SectionType[]) => {
    if (roadmap) {
      setRoadmap({
        ...roadmap,
        sections: updatedSections,
      })
    }
  }
  const handleReorderSections = async (draggedSectionId: string, targetSectionId: string) => {
    if (!roadmap || draggedSectionId === targetSectionId) return

    const currentSections = roadmap.sections
    const fromIndex = currentSections.findIndex((section) => section.id === draggedSectionId)
    const toIndex = currentSections.findIndex((section) => section.id === targetSectionId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

    const reorderedSections = [...currentSections]
    const [movedSection] = reorderedSections.splice(fromIndex, 1)
    reorderedSections.splice(toIndex, 0, movedSection)

    const previousSections = currentSections
    const normalizedSections = reorderedSections.map((section, index) => ({
      ...section,
      order: index,
    }))

    setRoadmap({
      ...roadmap,
      sections: normalizedSections,
    })

    try {
      const responses = await Promise.all(
        normalizedSections.map((section, index) =>
          fetch("/api/roadmap/sections", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: section.id,
              order: index,
            }),
          })
        )
      )
      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to persist section order")
      }
    } catch {
      setRoadmap({
        ...roadmap,
        sections: previousSections,
      })
      toast({
        title: "Error",
        description: "Failed to reorder sections",
        variant: "destructive",
      })
    }
  }

  const handleSectionClick = (section: SectionType) => {
    // Section panel is handled within Section component
  }

  const handleItemClick = (item: RoadmapItem) => {
    setSelectedItem(item)
    setIsItemPanelOpen(true)
  }

  const handleItemUpdate = (updatedItem: RoadmapItem) => {
    if (roadmap) {
      const updatedSections = roadmap.sections.map((section) => ({
        ...section,
        items: section.items.map((i) =>
          i.id === updatedItem.id ? updatedItem : i
        ),
      }))
      setRoadmap({
        ...roadmap,
        sections: updatedSections,
      })
      setSelectedItem(updatedItem)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="max-w-xl rounded border border-red-200 bg-white p-6 text-left shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Roadmap is temporarily unavailable</h2>
          <p className="mt-2 text-sm text-gray-700">
            {loadError || "The app could not load roadmap data right now."}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => fetchRoadmap()}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#2f315b] bg-cover bg-fixed bg-top bg-no-repeat"
      style={{ backgroundImage: "url('/roadmap-hero-bg.png')" }}
    >
      <header className="border-b border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))]/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img
                src="/thrive-trm-logo.png"
                alt="Thrive TRM logo"
                className="h-8 w-8 rounded-sm object-contain"
              />
              <h1 className="text-2xl font-semibold text-[hsl(var(--roadmap-text-primary))]">Thrive Roadmap</h1>
            </div>
            <MainNav />
          </div>
          <div className="flex items-center gap-3">
            {showAdminControls && (
              <div className="flex items-center gap-2 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] px-2 py-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSnapshotName(`Snapshot ${new Date().toLocaleDateString()}`)
                    setIsSnapshotDialogOpen(true)
                  }}
                  title="Save snapshot"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Snapshot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewMode(true)}
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/users")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
              </div>
            )}
            {isPreviewMode && (
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(false)}
              >
                Exit Preview
              </Button>
            )}
            {!isPreviewMode && (
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!isPreviewMode && (
          <div className="mb-6 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[hsl(var(--roadmap-text-primary))]">Analytics</h2>
                <p className="text-xs text-[hsl(var(--roadmap-text-muted))]">
                  Executive snapshot from the full roadmap dataset.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailedQuarterMatrix((prev) => !prev)}
              >
                {showDetailedQuarterMatrix ? "Hide detailed quarter matrix" : "Show detailed quarter matrix"}
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={analyticsQuarterScope === "all" ? "default" : "outline"}
                onClick={() => setAnalyticsQuarterScope("all")}
                className={
                  analyticsQuarterScope === "all"
                    ? "border-[#2f315b] bg-[#2f315b] text-white hover:bg-[#26284a]"
                    : "border-[#2f315b]/45 bg-[#2f315b]/12 text-[#2f315b] hover:bg-[#2f315b]/20"
                }
              >
                All quarters
              </Button>
              {QUARTERS.map((quarter) => (
                <Button
                  key={quarter}
                  type="button"
                  size="sm"
                  variant={analyticsQuarterScope === quarter ? "default" : "outline"}
                  onClick={() => setAnalyticsQuarterScope(quarter)}
                  className={
                    analyticsQuarterScope === quarter
                      ? "border-[#2f315b] bg-[#2f315b] text-white hover:bg-[#26284a]"
                      : "border-[#2f315b]/45 bg-[#2f315b]/12 text-[#2f315b] hover:bg-[#2f315b]/20"
                  }
                >
                  Q{quarter} {year}
                </Button>
              ))}
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-green-200 bg-green-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-green-700">On Track</p>
                <p className="text-2xl font-semibold text-green-900">{kpiMetrics.onTrackCount}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-amber-700">At Risk</p>
                <p className="text-2xl font-semibold text-amber-900">{kpiMetrics.atRiskCount}</p>
                <p className="text-xs text-amber-700">At risk + Delayed</p>
              </div>
              <div className="rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">In Development</p>
                <p className="text-2xl font-semibold">{kpiMetrics.inDevelopmentCount}</p>
              </div>
              <div className="rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Discovery &amp; Design</p>
                <p className="text-2xl font-semibold">{kpiMetrics.discoveryAndDesignCount}</p>
              </div>
            </div>

            {showDetailedQuarterMatrix && (
              <div className="mt-3 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Detailed Quarter Matrix</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {QUARTERS.map((quarter) => (
                    <div key={quarter} className="rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] p-2">
                      <p className="mb-1 text-xs font-medium">Q{quarter} {year}</p>
                      <div className="space-y-1 text-xs text-[hsl(var(--roadmap-text-muted))]">
                        <div className="flex items-center justify-between"><span>Total</span><span>{analyticsByQuarter[quarter]?.total ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span>On track</span><span>{analyticsByQuarter[quarter]?.onTrack ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span>At risk</span><span>{analyticsByQuarter[quarter]?.atRisk ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span>Delayed</span><span>{analyticsByQuarter[quarter]?.delayed ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span>Development</span><span>{analyticsByQuarter[quarter]?.development ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span>Released</span><span>{analyticsByQuarter[quarter]?.released ?? 0}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex justify-end">
          <div className="relative" ref={filterPopoverRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
              className="border-white bg-white text-[#2f315b] shadow-sm hover:bg-slate-100"
              title="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {isFilterActive && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-amber-500" />
            )}
            {isFilterPopoverOpen && (
              <div className="absolute right-0 z-30 mt-2 w-[360px] rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Workstream Filters</p>
                  {isFilterActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuarterFilter("all")
                        setHealthFilter("all")
                        setProgressFilter("all")
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid gap-2.5">
                  <div className="grid gap-1">
                    <Label className="text-xs uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Quarter</Label>
                    <select
                      value={quarterFilter}
                      onChange={(e) => setQuarterFilter(e.target.value as "all" | "1" | "2" | "3" | "4")}
                      className="h-9 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] px-3 text-sm"
                    >
                      <option value="all">All quarters</option>
                      {QUARTERS.map((q) => (
                        <option key={q} value={String(q)}>
                          Q{q} {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Health status</Label>
                    <select
                      value={healthFilter}
                      onChange={(e) => setHealthFilter(e.target.value)}
                      className="h-9 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] px-3 text-sm"
                    >
                      <option value="all">All health statuses</option>
                      <option value="__none__">Unspecified</option>
                      {healthFilterOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs uppercase tracking-wide text-[hsl(var(--roadmap-text-muted))]">Progress status</Label>
                    <select
                      value={progressFilter}
                      onChange={(e) => setProgressFilter(e.target.value)}
                      className="h-9 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] px-3 text-sm"
                    >
                      <option value="all">All progress statuses</option>
                      {progressFilterOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div
              className="mb-3 grid items-center gap-3 border-b border-[hsl(var(--roadmap-border-default))] px-3 pb-2"
              style={{ gridTemplateColumns }}
            >
              <div className="text-xs font-bold uppercase tracking-wide text-white">Initiative</div>
              <div className="text-xs font-bold uppercase tracking-wide text-white">Health</div>
              <div className="text-xs font-bold uppercase tracking-wide text-white">Progress</div>
              {columns.map((col, index) => {
                const displayText = col.type === "quarter" 
                  ? `${col.name} ${year}` 
                  : col.name
                
                return (
                  <div key={index} className="flex items-center justify-center gap-1 text-center text-xs font-bold uppercase tracking-wide text-white">
                    {editingColumnIndex === index && showAdminControls ? (
                      <Input
                        value={editingColumnValue}
                        onChange={(e) => setEditingColumnValue(e.target.value)}
                        onBlur={() => {
                          if (editingColumnValue.trim()) {
                            const newColumns = [...columns]
                            newColumns[index].name = editingColumnValue.trim()
                            setColumns(newColumns)
                          }
                          setEditingColumnIndex(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingColumnValue.trim()) {
                              const newColumns = [...columns]
                              newColumns[index].name = editingColumnValue.trim()
                              setColumns(newColumns)
                            }
                            setEditingColumnIndex(null)
                          }
                          if (e.key === "Escape") {
                            setEditingColumnIndex(null)
                          }
                        }}
                        className="h-8 text-center"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (showAdminControls) {
                              setEditingColumnValue(displayText)
                              setEditingColumnIndex(index)
                            }
                          }}
                          className={`${
                            showAdminControls
                              ? "cursor-pointer rounded px-2 py-1 hover:bg-[hsl(var(--roadmap-surface-subtle))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))]"
                              : ""
                          }`}
                          title={showAdminControls ? "Click to edit" : ""}
                        >
                          {displayText}
                        </button>
                        {showAdminControls && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Remove column "${displayText}"?`)) {
                                const newColumns = columns.filter((_, i) => i !== index)
                                setColumns(newColumns)
                              }
                            }}
                            title="Remove column"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {showAdminControls && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newColumn = {
                        name: `Column ${columns.length + 1}`,
                        type: "custom" as const,
                        order: columns.length,
                      }
                      setColumns([...columns, newColumn])
                    }}
                    title="Add column"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {tableFilteredSections.map((section) => (
              <div
                key={section.id}
                draggable={showAdminControls && !isFilterActive}
                onDragStart={(e) => {
                  if (!showAdminControls || isFilterActive) return
                  e.dataTransfer.effectAllowed = "move"
                  e.dataTransfer.setData("text/plain", section.id)
                  setDraggingSectionId(section.id)
                }}
                onDragOver={(e) => {
                  if (!showAdminControls || isFilterActive || !draggingSectionId || draggingSectionId === section.id) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  setDragOverSectionId(section.id)
                }}
                onDrop={(e) => {
                  if (!showAdminControls || isFilterActive || !draggingSectionId) return
                  e.preventDefault()
                  void handleReorderSections(draggingSectionId, section.id)
                  setDraggingSectionId(null)
                  setDragOverSectionId(null)
                }}
                onDragEnd={() => {
                  setDraggingSectionId(null)
                  setDragOverSectionId(null)
                }}
                className={`rounded-lg transition ${
                  showAdminControls && !isFilterActive ? "cursor-grab active:cursor-grabbing" : ""
                } ${dragOverSectionId === section.id && draggingSectionId !== section.id
                  ? "ring-2 ring-[hsl(var(--roadmap-accent-brand))]/40"
                  : ""
                }`}
              >
                <Section
                  section={section}
                  year={year}
                  isAdmin={isAdmin && !isPreviewMode}
                  showColumnActions={isAdmin && !isPreviewMode}
                  onDelete={handleDeleteSection}
                  onUpdate={handleUpdateRoadmap}
                  allSections={roadmap.sections}
                  onSectionClick={handleSectionClick}
                  onItemClick={handleItemClick}
                  columns={columns}
                  gridTemplateColumns={gridTemplateColumns}
                  allowItemReorder={!isFilterActive}
                />
              </div>
            ))}

            {showAdminControls && (
              <>
                {isAddingSection ? (
                  <div
                    className="mb-2 grid gap-3 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] p-3"
                    style={{ gridTemplateColumns }}
                  >
                    <div style={{ gridColumn: `span ${columns.length + 3 + (showAdminControls ? 1 : 0)}` }}>
                      <form onSubmit={handleCreateSection} className="flex gap-2">
                        <Input
                          placeholder="Enter section name..."
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button type="submit" disabled={isCreatingSection} size="sm">
                          {isCreatingSection ? "Creating..." : "Add"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddingSection(false)
                            setNewSectionName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mb-2 grid gap-3 rounded-md border border-dashed border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] p-3"
                    style={{ gridTemplateColumns }}
                  >
                    <div style={{ gridColumn: `span ${columns.length + 3 + (showAdminControls ? 1 : 0)}` }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingSection(true)}
                        className="text-[hsl(var(--roadmap-text-muted))] hover:text-[hsl(var(--roadmap-text-primary))]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Section
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {tableFilteredSections.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No roadmap items match the selected filters.
              </div>
            )}
          </div>
        </div>

        {selectedItem && (
          <ItemPanel
            item={selectedItem}
            isOpen={isItemPanelOpen}
            onClose={() => {
              setIsItemPanelOpen(false)
              setSelectedItem(null)
            }}
            onRefresh={fetchRoadmap}
            onSave={async (data) => {
              try {
                const response = await fetch("/api/roadmap/items", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: selectedItem.id,
                    ...data,
                    year,
                  }),
                })

                if (response.ok) {
                  const updatedItem = await response.json()
                  handleItemUpdate(updatedItem)
                  toast({
                    title: "Success",
                    description: "Item updated successfully",
                  })
                } else {
                  const error = await response.json()
                  toast({
                    title: "Error",
                    description: error.error || "Failed to update item",
                    variant: "destructive",
                  })
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "An error occurred while updating item",
                  variant: "destructive",
                })
              }
            }}
            year={year}
            isAdmin={isAdmin}
            allItems={
              roadmap?.sections.flatMap((s) => s.items) ?? []
            }
          />
        )}

        <Dialog open={isSnapshotDialogOpen} onOpenChange={setIsSnapshotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Snapshot</DialogTitle>
              <DialogDescription>
                Create a point-in-time snapshot of the current roadmap for reference.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="snapshot-name">Name</Label>
                <Input
                  id="snapshot-name"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="e.g. Q1 2025 Planning"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSnapshotDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!snapshotName.trim() || isCreatingSnapshot}
                onClick={async () => {
                  if (!roadmap?.id || !snapshotName.trim()) return
                  setIsCreatingSnapshot(true)
                  try {
                    const res = await fetch("/api/roadmap/snapshots", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        roadmapId: roadmap.id,
                        name: snapshotName.trim(),
                      }),
                    })
                    if (res.ok) {
                      setIsSnapshotDialogOpen(false)
                      setSnapshotName("")
                      toast({
                        title: "Snapshot saved",
                        description: "Roadmap snapshot has been created.",
                      })
                    } else {
                      const err = await res.json()
                      toast({
                        title: "Error",
                        description: err.error || "Failed to save snapshot",
                        variant: "destructive",
                      })
                    }
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to save snapshot",
                      variant: "destructive",
                    })
                  } finally {
                    setIsCreatingSnapshot(false)
                  }
                }}
              >
                {isCreatingSnapshot ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
