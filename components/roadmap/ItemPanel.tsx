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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ExternalLink, Pencil, MoreHorizontal, Trash2 } from "lucide-react"
import type { ItemComment, RoadmapItem } from "@/types/roadmap"

interface ItemPanelProps {
  item: RoadmapItem
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    description: string | null
    status: string
    risk: string | null
    blockerNotes: string | null
    quarters: number[]
    jiraLinks: string
    dependsOnIds?: string[]
    productBrief?: string | null
    designs?: string | null
  }) => Promise<void>
  year: number
  isAdmin: boolean
  onRefresh?: () => void
  allItems?: RoadmapItem[]
  onDelete?: () => void
}

const STATUS_OPTIONS = [
  "Not started",
  "Discovery",
  "Design",
  "Planning",
  "Development",
  "Released",
]

const HEALTH_OPTIONS = ["Not started", "On track", "At risk", "Delayed"] as const

function formatChangeType(changeType: string): string {
  const map: Record<string, string> = {
    created: "Item created",
    name_changed: "Name changed",
    status_changed: "Status changed",
    quarters_changed: "Timing changed",
    risk_changed: "Health changed",
  }
  return map[changeType] ?? changeType.replace(/_/g, " ")
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function renderCommentContent(content: string): React.ReactNode {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  const parts = content.split(urlPattern)

  return parts.map((part, index) => {
    if (isUrl(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {part}
        </a>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function sortCommentsNewestFirst(comments: ItemComment[]): ItemComment[] {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export default function ItemPanel({
  item,
  isOpen,
  onClose,
  onSave,
  year,
  isAdmin,
  onRefresh,
  allItems = [],
  onDelete,
}: ItemPanelProps) {
  const availableDeps = allItems.filter((i) => i.id !== item.id)
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || "")
  const [status, setStatus] = useState(item.status)
  const [risk, setRisk] = useState<string | null>(item.risk || null)
  const [blockerNotes, setBlockerNotes] = useState(item.blockerNotes || "")
  const [productBrief, setProductBrief] = useState(item.productBrief || "")
  const [designs, setDesigns] = useState(item.designs || "")
  const [quarters, setQuarters] = useState<number[]>([])
  const [jiraLink, setJiraLink] = useState("")
  const [dependsOnIds, setDependsOnIds] = useState<string[]>([])
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<ItemComment[]>(
    sortCommentsNewestFirst(item.comments ?? [])
  )
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState("")
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(item.name)
      setDescription(item.description || "")
      setStatus(item.status)
      setRisk(item.risk || null)
      setBlockerNotes(item.blockerNotes || "")
      setProductBrief(item.productBrief || "")
      setDesigns(item.designs || "")
      setQuarters(
        item.quarters
          .filter((q) => q.year === year)
          .map((q) => q.quarter)
          .sort()
      )
      setJiraLink(item.jiraLinks || "")
      setDependsOnIds(
        (item.dependencies || []).map((d) => d.dependsOnId)
      )
      setComments(sortCommentsNewestFirst(item.comments ?? []))
      setNewComment("")
      setEditingCommentId(null)
      setEditingCommentContent("")
      setIsUpdatingComment(false)
      setDeletingCommentId(null)
      setIsEditing(false)
      setIsSaving(false)
      setIsDeleteDialogOpen(false)
    }
  }, [isOpen, item, year])

  const handleQuarterToggle = (quarter: number) => {
    setQuarters((prev) =>
      prev.includes(quarter)
        ? prev.filter((q) => q !== quarter)
        : [...prev, quarter].sort()
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    setIsSaving(true)
    try {
      await onSave({
        name,
        description: description || null,
        status,
        risk: risk || null,
        blockerNotes: blockerNotes || null,
        quarters,
        jiraLinks: jiraLink.trim(),
        dependsOnIds,
        productBrief: productBrief || null,
        designs: designs || null,
      })
      setIsEditing(false)
    } catch {
      // Error toast already shown by onSave — stay in edit mode
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAdmin) return
    try {
      const res = await fetch("/api/roadmap/items/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, content: newComment.trim() }),
      })
      if (res.ok) {
        const createdComment = await res.json()
        setComments((prev) =>
          sortCommentsNewestFirst([...prev, createdComment])
        )
        setNewComment("")
        onRefresh?.()
      }
    } catch {
      // pass
    }
  }

  const handleStartCommentEdit = (comment: ItemComment) => {
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
  }

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null)
    setEditingCommentContent("")
    setIsUpdatingComment(false)
  }

  const handleSaveCommentEdit = async () => {
    if (!editingCommentId || !editingCommentContent.trim() || !isAdmin) return

    setIsUpdatingComment(true)
    try {
      const res = await fetch("/api/roadmap/items/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: editingCommentId,
          content: editingCommentContent.trim(),
        }),
      })
      if (res.ok) {
        const updatedComment = await res.json()
        setComments((prev) =>
          sortCommentsNewestFirst(prev.map((comment) =>
            comment.id === updatedComment.id
              ? { ...comment, content: updatedComment.content, createdAt: updatedComment.createdAt }
              : comment
          ))
        )
        handleCancelCommentEdit()
        onRefresh?.()
      }
    } catch {
      setIsUpdatingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin) return

    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/roadmap/items/comments?commentId=${commentId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId))
        if (editingCommentId === commentId) {
          handleCancelCommentEdit()
        }
        onRefresh?.()
      }
    } catch {
      // pass
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleConfirmDelete = () => {
    setIsDeleteDialogOpen(false)
    onDelete?.()
    onClose()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Not started": "bg-gray-100 text-gray-700",
      Discovery: "bg-purple-100 text-purple-800",
      Design: "bg-purple-200 text-purple-800",
      Planning: "bg-purple-300 text-purple-900",
      Development: "bg-purple-500 text-white",
      Released: "bg-green-100 text-green-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="flex-1 pr-2">
                {isEditing ? "Edit Item" : item.name}
              </SheetTitle>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setIsDeleteDialogOpen(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
            <SheetDescription>
              {isEditing
                ? "Update the details for this roadmap item."
                : "View details for this roadmap item."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    rows={4}
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
                  <Label htmlFor="health">Health</Label>
                  <Select value={risk || "none"} onValueChange={(v) => setRisk(v === "none" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select health status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {HEALTH_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="blockerNotes">Blocker / Risk Notes</Label>
                  <Textarea
                    id="blockerNotes"
                    value={blockerNotes}
                    onChange={(e) => setBlockerNotes(e.target.value)}
                    rows={2}
                    placeholder="Anything that might delay delivery..."
                  />
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
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Links</p>
                  <div className="grid gap-2">
                    <Label htmlFor="productBrief">Product Brief</Label>
                    <Input
                      id="productBrief"
                      value={productBrief}
                      onChange={(e) => setProductBrief(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="designs">Designs</Label>
                    <Input
                      id="designs"
                      value={designs}
                      onChange={(e) => setDesigns(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jiraLink">JIRA Link</Label>
                    <Input
                      id="jiraLink"
                      value={jiraLink}
                      onChange={(e) => setJiraLink(e.target.value)}
                      placeholder="https://... or PROJ-123"
                    />
                  </div>
                </div>
                {availableDeps.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Depends On</Label>
                    <div className="max-h-32 overflow-y-auto rounded border border-gray-200 p-2">
                      {availableDeps.map((other) => (
                        <label
                          key={other.id}
                          className="flex items-center gap-2 py-1 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={dependsOnIds.includes(other.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDependsOnIds((prev) =>
                                  [...prev, other.id].sort()
                                )
                              } else {
                                setDependsOnIds((prev) =>
                                  prev.filter((id) => id !== other.id)
                                )
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <span>{other.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.description || "No description provided."}
                  </p>
                </div>
                {isAdmin && (
                  <div>
                    <Label className="text-sm font-semibold">Health</Label>
                    <div className="mt-1">
                      {item.risk ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            item.risk === "Delayed"
                              ? "bg-red-100 text-red-800"
                              : item.risk === "At risk"
                              ? "bg-amber-100 text-amber-800"
                              : item.risk === "Not started"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.risk}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-semibold">Blocker / Risk Notes</Label>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.blockerNotes || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Depends On</Label>
                  {(item.dependencies?.length ?? 0) > 0 ? (
                    <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
                      {item.dependencies?.map((d) => (
                        <li key={d.id}>{d.dependsOn?.name ?? d.dependsOnId}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">—</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status || "Not started"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Links</p>
                  <div>
                    <Label className="text-sm font-semibold">Product Brief</Label>
                    <div className="mt-1">
                      {item.productBrief ? (
                        isUrl(item.productBrief) ? (
                          <a
                            href={item.productBrief}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-1 break-all text-sm text-blue-600 hover:underline"
                          >
                            {item.productBrief}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">{item.productBrief}</p>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Designs</Label>
                    <div className="mt-1">
                      {item.designs ? (
                        isUrl(item.designs) ? (
                          <a
                            href={item.designs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-1 break-all text-sm text-blue-600 hover:underline"
                          >
                            {item.designs}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">{item.designs}</p>
                        )
                      ) : (
                        <p className="text-sm text-gray-500">—</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">JIRA Link</Label>
                    {item.jiraLinks ? (
                      <div className="mt-1">
                        {isUrl(item.jiraLinks) ? (
                          <a
                            href={item.jiraLinks}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-1 break-all text-sm text-blue-600 hover:underline"
                          >
                            {item.jiraLinks}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">{item.jiraLinks}</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">—</p>
                    )}
                  </div>
                </div>
                {comments.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Comments</Label>
                    <div className="mt-2 space-y-2">
                      {comments.map((c) => (
                        <div key={c.id} className="rounded bg-gray-50 p-2 text-sm">
                          {editingCommentId === c.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveCommentEdit}
                                  disabled={isUpdatingComment || !editingCommentContent.trim()}
                                >
                                  {isUpdatingComment ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelCommentEdit}
                                  disabled={isUpdatingComment}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="break-words">{renderCommentContent(c.content)}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                          {isAdmin && editingCommentId !== c.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleStartCommentEdit(c)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                              >
                                {deletingCommentId === c.id ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(item.changeLogs?.length ?? 0) > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Change Log</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {item.changeLogs?.map((c: { id: string; changeType: string; oldValue: string | null; newValue: string | null; createdAt: string }) => (
                        <div key={c.id} className="rounded bg-gray-50 p-2 text-sm">
                          <p className="font-medium">
                            {formatChangeType(c.changeType)}
                            {c.oldValue != null && c.newValue != null ? (
                              <span className="font-normal text-gray-600">
                                {" "}
                                &quot;{c.oldValue}&quot; → &quot;{c.newValue}&quot;
                              </span>
                            ) : c.newValue ? (
                              <span className="font-normal text-gray-600">
                                {" "}
                                &quot;{c.newValue}&quot;
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isAdmin && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-semibold">Add Comment</Label>
                      <div className="mt-1 flex gap-2">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a note..."
                          rows={2}
                          className="flex-1"
                        />
                        <Button onClick={handleAddComment} size="sm">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete work item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{item.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
