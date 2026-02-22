"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import type { Section, RoadmapItem } from "@/types/roadmap"

interface SectionPanelProps {
  section: Section
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: { name: string; description: string | null }) => void
  onDelete: (sectionId: string) => void
  onItemClick: (item: RoadmapItem) => void
  isAdmin: boolean
}

export default function SectionPanel({
  section,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onItemClick,
  isAdmin,
}: SectionPanelProps) {
  const [name, setName] = useState(section.name)
  const [description, setDescription] = useState(section.description || "")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(section.name)
      setDescription(section.description || "")
      setIsEditing(false)
    }
  }, [isOpen, section])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    onUpdate({
      name,
      description: description || null,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this section? All items will also be deleted.")) {
      onDelete(section.id)
      onClose()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Section" : section.name}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the details for this section."
              : "View details for this section."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sectionName">Name</Label>
                <Input
                  id="sectionName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sectionDescription">Description</Label>
                <Textarea
                  id="sectionDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit">Save Changes</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <Label className="text-sm font-semibold">Name</Label>
                <p className="mt-1 text-sm">{section.name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Description</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {section.description || "No description provided."}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">
                  Items ({section.items.length})
                </Label>
                {section.items.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onItemClick(item)
                          onClose()
                        }}
                        className="w-full rounded border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.status && (
                          <div className="mt-1 text-xs text-gray-500">
                            {item.status}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    No items in this section yet.
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => setIsEditing(true)}>Edit Section</Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Section
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
