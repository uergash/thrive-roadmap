"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import RoadmapItem from "./RoadmapItem"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SectionPanel from "./SectionPanel"
import type { Section as SectionType, RoadmapItem as RoadmapItemType } from "@/types/roadmap"

interface SectionProps {
  section: SectionType
  year: number
  isAdmin: boolean
  showColumnActions?: boolean
  onDelete: (sectionId: string) => void
  onUpdate: (sections: SectionType[]) => void
  allSections: SectionType[]
  onSectionClick: (section: SectionType) => void
  onItemClick: (item: RoadmapItemType) => void
  columns?: Array<{ name: string; type: "quarter" | "custom"; order: number; quarter?: number }>
  gridTemplateColumns?: string
  allowItemReorder?: boolean
}

export default function Section({
  section,
  year,
  isAdmin,
  showColumnActions = false,
  onDelete,
  onUpdate,
  allSections,
  onSectionClick,
  onItemClick,
  columns = [
    { name: "Q1", type: "quarter" as const, order: 0, quarter: 1 },
    { name: "Q2", type: "quarter" as const, order: 1, quarter: 2 },
    { name: "Q3", type: "quarter" as const, order: 2, quarter: 3 },
    { name: "Q4", type: "quarter" as const, order: 3, quarter: 4 },
  ],
  gridTemplateColumns,
  allowItemReorder = true,
}: SectionProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSectionPanelOpen, setIsSectionPanelOpen] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [isEditingSectionName, setIsEditingSectionName] = useState(false)
  const [sectionNameDraft, setSectionNameDraft] = useState(section.name)

  useEffect(() => {
    setSectionNameDraft(section.name)
  }, [section.name])

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    setIsCreatingItem(true)
    try {
      const response = await fetch("/api/roadmap/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: section.id,
          name: newItemName,
          status: "Not started",
          year,
        }),
      })

      if (response.ok) {
        const newItem = await response.json()
        const updatedSections = allSections.map((s) =>
          s.id === section.id
            ? { ...s, items: [...s.items, newItem] }
            : s
        )
        onUpdate(updatedSections)
        setIsAddingItem(false)
        setNewItemName("")
        toast({
          title: "Success",
          description: "Item created successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while creating item",
        variant: "destructive",
      })
    } finally {
      setIsCreatingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/roadmap/items?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedSections = allSections.map((s) =>
          s.id === section.id
            ? { ...s, items: s.items.filter((item) => item.id !== itemId) }
            : s
        )
        onUpdate(updatedSections)
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting item",
        variant: "destructive",
      })
    }
  }

  const handleUpdateItem = (updatedItem: RoadmapItemType) => {
    const updatedSections = allSections.map((s) =>
      s.id === section.id
        ? {
            ...s,
            items: s.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }
        : s
    )
    onUpdate(updatedSections)
  }

  const handleUpdateSection = async (data: { name: string; description: string | null }) => {
    try {
      const response = await fetch("/api/roadmap/sections", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: section.id,
          ...data,
        }),
      })

      if (response.ok) {
        const updatedSection = await response.json()
        const updatedSections = allSections.map((s) =>
          s.id === section.id ? { ...s, ...updatedSection } : s
        )
        onUpdate(updatedSections)
        toast({
          title: "Success",
          description: "Section updated successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update section",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating section",
        variant: "destructive",
      })
    }
  }
  const handleSectionNameBlur = async () => {
    if (!isAdmin) return
    const trimmed = sectionNameDraft.trim()
    setIsEditingSectionName(false)

    if (!trimmed) {
      setSectionNameDraft(section.name)
      return
    }

    if (trimmed === section.name) return

    const previousName = section.name
    const optimisticSections = allSections.map((s) =>
      s.id === section.id ? { ...s, name: trimmed } : s
    )
    onUpdate(optimisticSections)

    try {
      const response = await fetch("/api/roadmap/sections", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: section.id,
          name: trimmed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update section name")
      }

      const updatedSection = await response.json()
      const updatedSections = allSections.map((s) =>
        s.id === section.id ? { ...s, ...updatedSection } : s
      )
      onUpdate(updatedSections)
      setSectionNameDraft(updatedSection.name)
    } catch (error) {
      const revertedSections = allSections.map((s) =>
        s.id === section.id ? { ...s, name: previousName } : s
      )
      onUpdate(revertedSections)
      setSectionNameDraft(previousName)
      toast({
        title: "Error",
        description: "Failed to update section name",
        variant: "destructive",
      })
    }
  }
  const handleReorderItems = async (draggedItemId: string, targetItemId: string) => {
    if (draggedItemId === targetItemId) return

    const currentItems = section.items
    const fromIndex = currentItems.findIndex((item) => item.id === draggedItemId)
    const toIndex = currentItems.findIndex((item) => item.id === targetItemId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

    const reorderedItems = [...currentItems]
    const [movedItem] = reorderedItems.splice(fromIndex, 1)
    reorderedItems.splice(toIndex, 0, movedItem)

    const previousSections = allSections
    const normalizedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index,
    }))
    const updatedSections = allSections.map((s) =>
      s.id === section.id ? { ...s, items: normalizedItems } : s
    )

    onUpdate(updatedSections)

    try {
      const responses = await Promise.all(
        normalizedItems.map((item, index) =>
          fetch("/api/roadmap/items", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: item.id,
              order: index,
            }),
          })
        )
      )

      if (responses.some((response) => !response.ok)) {
        throw new Error("Failed to persist item order")
      }
    } catch (error) {
      onUpdate(previousSections)
      toast({
        title: "Error",
        description: "Failed to reorder items",
        variant: "destructive",
      })
    }
  }
  const sectionGridTemplate =
    gridTemplateColumns ||
    (showColumnActions
      ? `minmax(360px, 2.6fr) 132px 132px repeat(${columns.length}, minmax(110px, 1fr)) 44px`
      : `minmax(360px, 2.6fr) 132px 132px repeat(${columns.length}, minmax(110px, 1fr))`)
  const fullWidthSpan = columns.length + 3 + (showColumnActions ? 1 : 0)

  return (
    <>
      <div className="mb-4 rounded-lg border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-base))]">
        <div
          className="grid items-center gap-3 border-b border-[hsl(var(--roadmap-border-default))] px-3 py-2.5"
          style={{ gridTemplateColumns: sectionGridTemplate }}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {isAdmin && isEditingSectionName ? (
              <Input
                value={sectionNameDraft}
                onChange={(e) => setSectionNameDraft(e.target.value)}
                onBlur={() => void handleSectionNameBlur()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  }
                  if (e.key === "Escape") {
                    setSectionNameDraft(section.name)
                    setIsEditingSectionName(false)
                  }
                }}
                className="h-8 max-w-sm text-sm font-semibold"
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  if (isAdmin) {
                    setIsEditingSectionName(true)
                  } else {
                    onSectionClick(section)
                    setIsSectionPanelOpen(true)
                  }
                }}
                className="cursor-pointer text-left text-sm font-semibold text-[hsl(var(--roadmap-text-primary))] hover:text-[hsl(var(--roadmap-accent-brand))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--roadmap-accent-brand))]"
              >
                {section.name}
              </button>
            )}
            <span className="whitespace-nowrap text-xs text-[hsl(var(--roadmap-text-muted))]">
              {section.items.length} {section.items.length === 1 ? "item" : "items"}
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSectionClick(section)
                  setIsSectionPanelOpen(true)
                }}
                className="h-7 px-2 text-xs text-[hsl(var(--roadmap-text-muted))] hover:text-[hsl(var(--roadmap-text-primary))]"
              >
                Details
              </Button>
            )}
          </div>
          <div></div>
          <div></div>
          {columns.map((_, index) => (
            <div key={index}></div>
          ))}
          {showColumnActions && <div></div>}
        </div>

        {isExpanded && (
          <div className="px-2 py-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                draggable={isAdmin && allowItemReorder}
                onDragStart={(e) => {
                  if (!isAdmin || !allowItemReorder) return
                  e.dataTransfer.effectAllowed = "move"
                  e.dataTransfer.setData("text/plain", item.id)
                  setDraggingItemId(item.id)
                }}
                onDragOver={(e) => {
                  if (!isAdmin || !allowItemReorder || !draggingItemId || draggingItemId === item.id) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  setDragOverItemId(item.id)
                }}
                onDrop={(e) => {
                  if (!isAdmin || !allowItemReorder || !draggingItemId) return
                  e.preventDefault()
                  void handleReorderItems(draggingItemId, item.id)
                  setDraggingItemId(null)
                  setDragOverItemId(null)
                }}
                onDragEnd={() => {
                  setDraggingItemId(null)
                  setDragOverItemId(null)
                }}
                className={`rounded-md transition ${
                  isAdmin && allowItemReorder ? "cursor-grab active:cursor-grabbing" : ""
                } ${dragOverItemId === item.id && draggingItemId !== item.id
                  ? "ring-2 ring-[hsl(var(--roadmap-accent-brand))]/40"
                  : ""
                }`}
              >
                <RoadmapItem
                  item={item}
                  year={year}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteItem}
                  onUpdate={handleUpdateItem}
                  columns={columns}
                  showColumnActions={showColumnActions}
                  allItems={allSections.flatMap((s) => s.items)}
                  gridTemplateColumns={sectionGridTemplate}
                />
              </div>
            ))}
          
            {isAdmin && (
              <>
                {isAddingItem ? (
                  <div
                    className="mb-1 grid gap-3 rounded-md border border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] p-2.5"
                    style={{ gridTemplateColumns: sectionGridTemplate }}
                  >
                    <div style={{ gridColumn: `span ${fullWidthSpan}` }}>
                      <form onSubmit={handleCreateItem} className="ml-10 flex gap-2">
                        <Input
                          placeholder="Enter item name..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button type="submit" disabled={isCreatingItem} size="sm">
                          {isCreatingItem ? "Creating..." : "Add"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsAddingItem(false)
                            setNewItemName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mb-1 grid gap-3 rounded-md border border-dashed border-[hsl(var(--roadmap-border-default))] bg-[hsl(var(--roadmap-surface-subtle))] p-2.5"
                    style={{ gridTemplateColumns: sectionGridTemplate }}
                  >
                    <div style={{ gridColumn: `span ${fullWidthSpan}` }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingItem(true)}
                        className="ml-10 text-[hsl(var(--roadmap-text-muted))] hover:text-[hsl(var(--roadmap-text-primary))]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <SectionPanel
        section={section}
        isOpen={isSectionPanelOpen}
        onClose={() => setIsSectionPanelOpen(false)}
        onUpdate={handleUpdateSection}
        onDelete={onDelete}
        onItemClick={onItemClick}
        isAdmin={isAdmin}
      />
    </>
  )
}
