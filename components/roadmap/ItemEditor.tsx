"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RoadmapItem } from "@/types/roadmap"

interface ItemEditorProps {
  item: RoadmapItem
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    description: string | null
    status: string
    quarters: number[]
    jiraLinks: string
  }) => void
  year: number
}

const STATUS_OPTIONS = [
  "Not started",
  "Discovery",
  "Design",
  "Planning",
  "Development",
  "Released",
]

export default function ItemEditor({
  item,
  isOpen,
  onClose,
  onSave,
  year,
}: ItemEditorProps) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || "")
  const [status, setStatus] = useState(item.status)
  const [quarters, setQuarters] = useState<number[]>([])
  const [jiraLink, setJiraLink] = useState("")

  useEffect(() => {
    if (isOpen) {
      setName(item.name)
      setDescription(item.description || "")
      setStatus(item.status)
      setQuarters(
        item.quarters
          .filter((q) => q.year === year)
          .map((q) => q.quarter)
          .sort()
      )
      setJiraLink(item.jiraLinks || "")
    }
  }, [isOpen, item, year])

  const handleQuarterToggle = (quarter: number) => {
    setQuarters((prev) =>
      prev.includes(quarter)
        ? prev.filter((q) => q !== quarter)
        : [...prev, quarter].sort()
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description: description || null,
      status,
      quarters,
      jiraLinks: jiraLink.trim(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Roadmap Item</DialogTitle>
            <DialogDescription>
              Update the details for this roadmap item.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Quarters ({year})</Label>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((q) => (
                  <label key={q} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={quarters.includes(q)}
                      onChange={() => handleQuarterToggle(q)}
                      className="h-4 w-4"
                    />
                    <span>Q{q}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jiraLink">JIRA Link</Label>
              <Input
                id="jiraLink"
                placeholder="PROJ-123 or JIRA URL"
                value={jiraLink}
                onChange={(e) => setJiraLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
