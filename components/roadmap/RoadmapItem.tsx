"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import QuarterBar from "./QuarterBar"
import ItemPanel from "./ItemPanel"
import StatusSelector from "./StatusSelector"
import HealthSelector from "./HealthSelector"
import { ExternalLink } from "lucide-react"
import type { RoadmapItem as RoadmapItemType } from "@/types/roadmap"

interface RoadmapItemProps {
  item: RoadmapItemType
  year: number
  isAdmin: boolean
  showColumnActions?: boolean
  onDelete: (itemId: string) => void
  onUpdate: (item: RoadmapItemType) => void
  columns?: Array<{ name: string; type: "quarter" | "custom"; order: number; quarter?: number }>
  allItems?: RoadmapItemType[]
  gridTemplateColumns?: string
  showHealthColumn?: boolean
}

export default function RoadmapItem({
  item,
  year,
  isAdmin,
  showColumnActions = false,
  onDelete,
  onUpdate,
  columns = [
    { name: "Q1", type: "quarter" as const, order: 0, quarter: 1 },
    { name: "Q2", type: "quarter" as const, order: 1, quarter: 2 },
    { name: "Q3", type: "quarter" as const, order: 2, quarter: 3 },
    { name: "Q4", type: "quarter" as const, order: 3, quarter: 4 },
  ],
  allItems = [],
  gridTemplateColumns,
  showHealthColumn = true,
}: RoadmapItemProps) {
  const { toast } = useToast()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(item.name)

  useEffect(() => {
    setNameDraft(item.name)
  }, [item.name])

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      onDelete(item.id)
    }
  }

  const handleQuarterToggle = async (quarter: number) => {
    const currentQuarters = getQuarterNumbers()
    const newQuarters = currentQuarters.includes(quarter)
      ? currentQuarters.filter((q) => q !== quarter)
      : [...currentQuarters, quarter].sort()

    // Optimistic update
    const updatedItem = {
      ...item,
      quarters: newQuarters.map((q) => ({
        id: `temp-${q}`,
        quarter: q,
        year,
        itemId: item.id,
      })),
    }
    onUpdate(updatedItem as RoadmapItemType)

    // Save to API in background
    handleSave({
      name: item.name,
      description: item.description,
      status: item.status,
      risk: item.risk || null,
      blockerNotes: item.blockerNotes || null,
      quarters: newQuarters,
      jiraLinks: item.jiraLinks,
    }).catch(() => {
      // Revert on error
      onUpdate(item)
      toast({
        title: "Error",
        description: "Failed to update quarters",
        variant: "destructive",
      })
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    const updatedItem = { ...item, status: newStatus }
    onUpdate(updatedItem as RoadmapItemType)
    handleSave({
      name: item.name,
      description: item.description,
      status: newStatus,
      risk: item.risk || null,
      blockerNotes: item.blockerNotes || null,
      quarters: getQuarterNumbers(),
      jiraLinks: item.jiraLinks,
    }).catch(() => {
      onUpdate(item)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    })
  }

  const handleHealthChange = async (health: string | null) => {
    const updatedItem = { ...item, risk: health }
    onUpdate(updatedItem as RoadmapItemType)
    handleSave({
      name: item.name,
      description: item.description,
      status: item.status,
      risk: health,
      blockerNotes: item.blockerNotes || null,
      quarters: getQuarterNumbers(),
      jiraLinks: item.jiraLinks,
    }).catch(() => {
      onUpdate(item)
      toast({
        title: "Error",
        description: "Failed to update health",
        variant: "destructive",
      })
    })
  }

  const handleSave = async (updatedData: {
    name: string
    description: string | null
    status: string
    risk?: string | null
    blockerNotes?: string | null
    quarters: number[]
    jiraLinks: string[]
    dependsOnIds?: string[]
    productBrief?: string | null
    designs?: string | null
  }): Promise<void> => {
    try {
      const response = await fetch("/api/roadmap/items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          ...updatedData,
          year,
          risk: updatedData.risk ?? item.risk,
          blockerNotes: updatedData.blockerNotes ?? item.blockerNotes,
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        onUpdate(updatedItem)
        if (isEditorOpen) {
          toast({
            title: "Success",
            description: "Item updated successfully",
          })
        }
      } else {
        const error = await response.json()
        const message = error.error || "Failed to update item"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        throw new Error(message)
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes("Failed to update")) {
        toast({
          title: "Error",
          description: "An error occurred while updating item",
          variant: "destructive",
        })
      }
      throw error
    }
  }

  const getQuarterNumbers = () => {
    return item.quarters
      .filter((q) => q.year === year)
      .map((q) => q.quarter)
      .sort()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Not started": "bg-gray-100 text-gray-700",
      Discovery: "bg-sky-100 text-sky-700",
      Design: "bg-indigo-100 text-indigo-700",
      Planning: "bg-violet-100 text-violet-700",
      Development: "bg-violet-200 text-violet-900",
      Released: "bg-emerald-100 text-emerald-700",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getHealthColor = (health: string | null) => {
    if (!health) return "bg-gray-100 text-gray-500"
    const colors: Record<string, string> = {
      "Not started": "bg-gray-100 text-gray-700",
      "On track": "bg-emerald-100 text-emerald-700",
      "At risk": "bg-amber-100 text-amber-800",
      Delayed: "bg-rose-100 text-rose-700",
    }
    return colors[health] || "bg-gray-100 text-gray-800"
  }
  const itemGridTemplate =
    gridTemplateColumns ||
    (showColumnActions
      ? `minmax(360px, 2.6fr) 132px 132px repeat(${columns.length}, minmax(110px, 1fr)) 44px`
      : `minmax(360px, 2.6fr) 132px 132px repeat(${columns.length}, minmax(110px, 1fr))`)

  const handleNameBlur = async () => {
    if (!isAdmin) return
    const trimmed = nameDraft.trim()
    setIsEditingName(false)

    if (!trimmed) {
      setNameDraft(item.name)
      return
    }
    if (trimmed === item.name) return

    const previousName = item.name
    onUpdate({ ...item, name: trimmed } as RoadmapItemType)

    try {
      const response = await fetch("/api/roadmap/items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          name: trimmed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item name")
      }

      const updatedItem = await response.json()
      onUpdate(updatedItem)
      setNameDraft(updatedItem.name)
    } catch (error) {
      onUpdate({ ...item, name: previousName } as RoadmapItemType)
      setNameDraft(previousName)
      toast({
        title: "Error",
        description: "Failed to update item name",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div
        className="group mb-1 grid items-center gap-3 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))] px-3 py-2 hover:bg-[hsl(var(--roadmap-surface-subtle))]"
        style={{ gridTemplateColumns: itemGridTemplate }}
      >
        <div className="flex items-center justify-between pl-9">
          <div className="flex-1">
            {isAdmin && isEditingName ? (
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => void handleNameBlur()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  }
                  if (e.key === "Escape") {
                    setNameDraft(item.name)
                    setIsEditingName(false)
                  }
                }}
                className="h-8 max-w-md text-sm font-medium"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  if (isAdmin) {
                    setIsEditingName(true)
                  } else {
                    setIsEditorOpen(true)
                  }
                }}
                className="w-full cursor-pointer text-left text-sm font-medium leading-5 text-[hsl(var(--roadmap-text-primary))] hover:text-[hsl(var(--roadmap-accent-brand))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))]"
              >
                {item.name}
              </button>
            )}
            {item.jiraLinks.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.jiraLinks.map((key) => (
                  <a
                    key={key}
                    href={`https://jira.example.com/browse/${key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-800 hover:bg-blue-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="pointer-events-none flex items-center opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditorOpen(true)
                }}
                className="h-6 w-6 focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))]"
                title="Open details"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        {showHealthColumn && (
          <div className="flex items-center">
            {isAdmin ? (
              <HealthSelector
                health={item.risk || null}
                onHealthChange={handleHealthChange}
              />
            ) : (
              <span
                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getHealthColor(
                  item.risk || null
                )}`}
              >
                {item.risk || "—"}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center">
          {isAdmin ? (
            <StatusSelector
              status={item.status || "Not started"}
              onStatusChange={(newStatus) => handleStatusChange(newStatus)}
            />
          ) : (
            <span
              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                item.status
              )}`}
            >
              {item.status || "Not started"}
            </span>
          )}
        </div>
        {columns.map((col, index) => {
          if (col.type === "quarter" && col.quarter) {
            return (
              <QuarterBar
                key={index}
                quarter={col.quarter}
                isActive={getQuarterNumbers().includes(col.quarter)}
                year={year}
                isAdmin={isAdmin}
                onToggle={isAdmin ? (q) => handleQuarterToggle(q) : undefined}
              />
            )
          } else {
            // Custom column - for now just show empty, can be extended later
            return (
              <div key={index} className="flex items-center justify-center">
                <div className="h-7 w-full rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))]"></div>
              </div>
            )
          }
        })}
        {showColumnActions && <div></div>}
      </div>

      <ItemPanel
        item={item}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        year={year}
        isAdmin={isAdmin}
        allItems={allItems}
        onDelete={isAdmin ? () => onDelete(item.id) : undefined}
      />
    </>
  )
}
