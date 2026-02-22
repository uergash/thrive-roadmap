"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import MainNav from "@/components/navigation/MainNav"
import { useToast } from "@/hooks/use-toast"
import type { FeedbackEntry, FeedbackTheme, FeedbackSource, FeedbackWorkflowStatus } from "@/types/insights"
import type { Roadmap } from "@/types/roadmap"

type FormState = {
  title: string
  summary: string
  submittedBy: string
  source: FeedbackSource
  sourceRef: string
  customerSegment: string
  isBeingAddressed: boolean
  workflowStatus: FeedbackWorkflowStatus
  jiraUrl: string
  urgency: number
  receivedAt: string
  themeId: string
  roadmapItemIds: string[]
  published: boolean
}

const emptyForm = (): FormState => ({
  title: "",
  summary: "",
  submittedBy: "",
  source: "SLACK",
  sourceRef: "",
  customerSegment: "",
  isBeingAddressed: false,
  workflowStatus: "NOT_STARTED",
  jiraUrl: "",
  urgency: 3,
  receivedAt: new Date().toISOString().slice(0, 16),
  themeId: "",
  roadmapItemIds: [],
  published: false,
})

const STUB_FEEDBACK: FeedbackEntry[] = [
  {
    id: "stub-feedback-1",
    title: "Search relevance for customer records",
    summary: "CS team says they cannot reliably find customer records by alternate spellings.",
    externalSource: "MANUAL",
    externalId: null,
    rawSourceUrl: null,
    lastSyncedAt: null,
    submittedBy: "Maya (CS Lead)",
    source: "SLACK",
    sourceRef: null,
    customerSegment: "Customer Success",
    isBeingAddressed: true,
    workflowStatus: "IN_PROGRESS",
    jiraUrl: "https://jira.example.com/browse/THRIVE-412",
    urgency: 4,
    receivedAt: new Date().toISOString(),
    published: true,
    theme: { id: "stub-theme-1", name: "Search", description: null, order: 0 },
    roadmapLinks: [],
    comments: [],
    commentCount: 0,
  },
  {
    id: "stub-feedback-2",
    title: "Interview notes ask for timeline transparency",
    summary: "Interview participants want clearer visibility into what is in progress and what is blocked.",
    externalSource: "MANUAL",
    externalId: null,
    rawSourceUrl: null,
    lastSyncedAt: null,
    submittedBy: "Jordan (Research)",
    source: "INTERVIEW",
    sourceRef: null,
    customerSegment: "Ops Leadership",
    isBeingAddressed: true,
    workflowStatus: "TRIAGED",
    jiraUrl: "https://jira.example.com/browse/THRIVE-398",
    urgency: 3,
    receivedAt: new Date().toISOString(),
    published: true,
    theme: { id: "stub-theme-2", name: "Visibility", description: null, order: 1 },
    roadmapLinks: [],
    comments: [],
    commentCount: 0,
  },
]

export default function FeedbackEditorView() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [themes, setThemes] = useState<FeedbackTheme[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  const canEdit = session?.user?.role === "ADMIN"
  const usingStubData = entries.length === 0

  const displayEntries = useMemo(() => {
    return entries.length > 0 ? entries : STUB_FEEDBACK
  }, [entries])

  const roadmapItems = useMemo(() => {
    return roadmap?.sections.flatMap((section) => section.items) ?? []
  }, [roadmap])

  const loadData = async () => {
    const feedbackRes = await fetch("/api/feedback")
    if (feedbackRes.ok) {
      setEntries(await feedbackRes.json())
    }

    if (canEdit) {
      const [themeRes, roadmapRes] = await Promise.all([
        fetch("/api/feedback/themes"),
        fetch(`/api/roadmap?year=${new Date().getFullYear()}`),
      ])
      if (themeRes.ok) {
        setThemes(await themeRes.json())
      }
      if (roadmapRes.ok) {
        setRoadmap(await roadmapRes.json())
      }
    }
  }

  const castVote = async (entry: FeedbackEntry, value: -1 | 1) => {
    if (!session?.user) return
    if (entry.id.startsWith("stub-")) return

    const currentVote = entry.userVote ?? 0
    const sameVote = currentVote === value

    const response = await fetch("/api/feedback/votes", {
      method: sameVote ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        sameVote
          ? { feedbackId: entry.id }
          : { feedbackId: entry.id, value }
      ),
    })

    if (response.ok) {
      const payload = await response.json()
      setEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                voteScore: payload.voteScore,
                userVote: payload.userVote,
              }
            : item
        )
      )
    }
  }

  const submitComment = async (entry: FeedbackEntry) => {
    if (!session?.user || entry.id.startsWith("stub-")) return
    const draft = (commentDrafts[entry.id] || "").trim()
    if (!draft) return

    const response = await fetch("/api/feedback/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackId: entry.id,
        content: draft,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Failed to add comment" }))
      toast({
        title: "Error",
        description: err.error || "Failed to add comment",
        variant: "destructive",
      })
      return
    }

    const comment = await response.json()
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              comments: [comment, ...(item.comments || [])],
              commentCount: (item.commentCount || item.comments?.length || 0) + 1,
            }
          : item
      )
    )
    setCommentDrafts((prev) => ({ ...prev, [entry.id]: "" }))
  }

  const removeComment = async (entry: FeedbackEntry, commentId: string) => {
    if (!session?.user || entry.id.startsWith("stub-")) return

    const response = await fetch("/api/feedback/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Failed to delete comment" }))
      toast({
        title: "Error",
        description: err.error || "Failed to delete comment",
        variant: "destructive",
      })
      return
    }

    setEntries((prev) =>
      prev.map((item) =>
        item.id === entry.id
          ? {
              ...item,
              comments: (item.comments || []).filter((comment) => comment.id !== commentId),
              commentCount: Math.max((item.commentCount || item.comments?.length || 1) - 1, 0),
            }
          : item
      )
    )
  }

  useEffect(() => {
    if (status === "loading") return
    loadData()
  }, [status, canEdit])

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canEdit) return

    setIsSaving(true)
    try {
      const payload = {
        ...form,
        submittedBy: form.submittedBy || null,
        sourceRef: form.sourceRef || null,
        customerSegment: form.customerSegment || null,
        themeId: form.themeId || null,
        jiraUrl: form.jiraUrl || null,
        receivedAt: new Date(form.receivedAt).toISOString(),
      }

      const response = await fetch("/api/feedback", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to save" }))
        throw new Error(err.error || "Failed to save")
      }

      await loadData()
      resetForm()
      toast({ title: "Saved", description: "Feedback entry updated." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save feedback",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (entry: FeedbackEntry) => {
    if (entry.id.startsWith("stub-")) return
    setEditingId(entry.id)
    setShowForm(true)
    setForm({
      title: entry.title,
      summary: entry.summary,
      submittedBy: entry.submittedBy || "",
      source: entry.source,
      sourceRef: entry.sourceRef || "",
      customerSegment: entry.customerSegment || "",
      isBeingAddressed: entry.isBeingAddressed,
      workflowStatus: entry.workflowStatus,
      jiraUrl: entry.jiraUrl || "",
      urgency: entry.urgency,
      receivedAt: new Date(entry.receivedAt).toISOString().slice(0, 16),
      themeId: entry.theme?.id || "",
      roadmapItemIds: entry.roadmapLinks.map((link) => link.itemId),
      published: entry.published,
    })
  }

  const togglePublish = async (entry: FeedbackEntry) => {
    if (!canEdit || entry.id.startsWith("stub-")) return
    const response = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, published: !entry.published }),
    })

    if (response.ok) {
      await loadData()
    }
  }

  const removeEntry = async (entryId: string) => {
    if (!canEdit || entryId.startsWith("stub-") || !confirm("Delete this feedback entry?")) return
    const response = await fetch(`/api/feedback?feedbackId=${entryId}`, {
      method: "DELETE",
    })
    if (response.ok) {
      await loadData()
      if (editingId === entryId) {
        resetForm()
      }
    }
  }

  const runSyncNow = async () => {
    if (!canEdit) return
    setIsSyncing(true)
    try {
      const response = await fetch("/api/feedback/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Sync failed" }))
        throw new Error(err.error || "Sync failed")
      }

      const payload = await response.json()
      await loadData()
      toast({
        title: "Sync complete",
        description: `Created ${payload.created}, updated ${payload.updated}, skipped ${payload.skipped}.`,
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unable to sync feedback",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Product Feedback</h1>
            <p className="text-sm text-gray-600">Current feedback signals and whether Product is addressing them.</p>
          </div>
          <MainNav />
        </div>
      </header>

      <main className="container mx-auto space-y-5 px-6 py-6">
        {usingStubData && (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Showing sample feedback rows. Add real feedback to replace this placeholder data.
          </div>
        )}

        <section className="rounded border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-lg font-semibold">Feedback Feed</h2>
              <p className="text-sm text-gray-600">
                Share visible feedback signals with teams and capture votes/comments directly.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-4">
            {displayEntries.map((entry) => {
              const canDeleteComment = (authorId: string) =>
                session?.user?.id === authorId || session?.user?.role === "ADMIN"
              const comments = entry.comments || []

              return (
                <article key={entry.id} className="rounded border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{entry.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="rounded bg-gray-100 px-2 py-1">{entry.source}</span>
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {new Date(entry.receivedAt).toLocaleDateString()}
                        </span>
                        <span className={`rounded px-2 py-1 ${entry.isBeingAddressed ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                          {entry.isBeingAddressed ? "Being addressed" : "Not addressed"}
                        </span>
                        <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">
                          {entry.workflowStatus.replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={entry.userVote === 1 ? "default" : "outline"}
                        disabled={!session?.user || entry.id.startsWith("stub-")}
                        onClick={() => castVote(entry, 1)}
                      >
                        ▲
                      </Button>
                      <span className="min-w-8 text-center font-semibold">{entry.voteScore ?? 0}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={entry.userVote === -1 ? "default" : "outline"}
                        disabled={!session?.user || entry.id.startsWith("stub-")}
                        onClick={() => castVote(entry, -1)}
                      >
                        ▼
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">{entry.summary}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span>Submitted by: {entry.submittedBy || "Unknown"}</span>
                    {entry.theme?.name && <span className="rounded bg-gray-100 px-2 py-1">Theme: {entry.theme.name}</span>}
                    {entry.jiraUrl && (
                      <a href={entry.jiraUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                        JIRA
                      </a>
                    )}
                    {entry.externalSource !== "MANUAL" && (
                      <span className="rounded bg-gray-100 px-2 py-1">
                        Synced from {entry.externalSource}
                      </span>
                    )}
                  </div>

                  {entry.roadmapLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.roadmapLinks.map((link) => (
                        <span key={link.itemId} className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
                          {link.item.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">
                        Comments ({entry.commentCount ?? comments.length})
                      </p>
                    </div>

                    <div className="space-y-2">
                      {comments.length === 0 && (
                        <p className="text-sm text-gray-500">No comments yet.</p>
                      )}
                      {comments.map((comment) => (
                        <div key={comment.id} className="rounded border border-gray-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-600">
                              {comment.author?.email || "Unknown user"} · {new Date(comment.createdAt).toLocaleString()}
                            </p>
                            {canDeleteComment(comment.authorId) && !entry.id.startsWith("stub-") && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={() => removeComment(entry, comment.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-800">{comment.content}</p>
                        </div>
                      ))}
                    </div>

                    {session?.user ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Textarea
                          rows={2}
                          value={commentDrafts[entry.id] || ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))
                          }
                          placeholder="Add a comment..."
                          disabled={entry.id.startsWith("stub-")}
                        />
                        <Button
                          type="button"
                          onClick={() => submitComment(entry)}
                          disabled={entry.id.startsWith("stub-") || !(commentDrafts[entry.id] || "").trim()}
                        >
                          Comment
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">Sign in to comment and vote.</p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(entry)} disabled={entry.id.startsWith("stub-")}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => togglePublish(entry)} disabled={entry.id.startsWith("stub-")}>
                        {entry.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => removeEntry(entry.id)} disabled={entry.id.startsWith("stub-")}>
                        Delete
                      </Button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {canEdit && (
          <section className="rounded border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Admin Controls</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={runSyncNow}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Syncing..." : "Sync Sources Now"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm())
                    setShowForm((prev) => !prev)
                  }}
                >
                  {showForm ? "Close Form" : "Add Feedback"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {canEdit && showForm && (
          <section className="rounded border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{editingId ? "Edit feedback" : "Add feedback"}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="submittedBy">Submitted By</Label>
                  <Input id="submittedBy" value={form.submittedBy} onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} placeholder="Name or team" />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Feedback summary</Label>
                <Textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} required />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="workflowStatus">Status</Label>
                  <select
                    id="workflowStatus"
                    className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm"
                    value={form.workflowStatus}
                    onChange={(e) => setForm({ ...form, workflowStatus: e.target.value as FeedbackWorkflowStatus })}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="TRIAGED">Triaged</option>
                    <option value="IN_PROGRESS">Worked On</option>
                    <option value="ADDRESSED">Addressed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as FeedbackSource })}
                  >
                    <option value="SLACK">Slack</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="SUPPORT">Support</option>
                    <option value="SALES">Sales</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="urgency">Urgency (1-5)</Label>
                  <Input id="urgency" type="number" min={1} max={5} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="receivedAt">Received At</Label>
                  <Input id="receivedAt" type="datetime-local" value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="jiraUrl">JIRA Link</Label>
                  <Input id="jiraUrl" type="url" placeholder="https://jira..." value={form.jiraUrl} onChange={(e) => setForm({ ...form, jiraUrl: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm"
                    value={form.themeId}
                    onChange={(e) => setForm({ ...form, themeId: e.target.value })}
                  >
                    <option value="">Uncategorized</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="segment">Customer Segment</Label>
                  <Input id="segment" value={form.customerSegment} onChange={(e) => setForm({ ...form, customerSegment: e.target.value })} />
                </div>
              </div>

              <div className="rounded border border-gray-200 p-3">
                <Label>Linked roadmap items</Label>
                <div className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
                  {roadmapItems.map((item) => (
                    <label key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.roadmapItemIds.includes(item.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.roadmapItemIds, item.id]
                            : form.roadmapItemIds.filter((id) => id !== item.id)
                          setForm({ ...form, roadmapItemIds: next })
                        }}
                      />
                      <span>{item.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isBeingAddressed}
                    onChange={(e) => setForm({ ...form, isBeingAddressed: e.target.checked })}
                  />
                  Being addressed
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  Publish in public view
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingId ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}
