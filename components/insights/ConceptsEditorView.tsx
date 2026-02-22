"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import MainNav from "@/components/navigation/MainNav"
import PublicConceptsView from "@/components/insights/PublicConceptsView"
import { useToast } from "@/hooks/use-toast"
import type { Concept, ConceptStage, ConceptArtifactType } from "@/types/insights"
import type { Roadmap } from "@/types/roadmap"

type FormState = {
  title: string
  summary: string
  problem: string
  howItWorks: string
  whyValuable: string
  validationPlan: string
  hypothesis: string
  stage: ConceptStage
  artifactType: ConceptArtifactType
  artifactUrl: string
  artifactLabel: string
  owner: string
  decisionDate: string
  published: boolean
  roadmapItemIds: string[]
}

const emptyForm = (): FormState => ({
  title: "",
  summary: "",
  problem: "",
  howItWorks: "",
  whyValuable: "",
  validationPlan: "",
  hypothesis: "",
  stage: "EXPLORING",
  artifactType: "MOCKUP",
  artifactUrl: "",
  artifactLabel: "",
  owner: "",
  decisionDate: "",
  published: false,
  roadmapItemIds: [],
})

const STUB_CONCEPTS: Concept[] = [
  {
    id: "stub-concept-1",
    title: "Adaptive Planning Assistant",
    summary: "Helps teams convert raw feedback into prioritized roadmap proposals.",
    problem: "Teams struggle to connect customer feedback to delivery decisions in one place.",
    howItWorks: "Assistant clusters incoming signals into themes and drafts roadmap options.",
    whyValuable: "Cuts planning cycles and makes prioritization rationale transparent.",
    validationPlan: "Pilot with Product + CS weekly triage for four weeks and compare decision speed.",
    hypothesis: "If signal-to-plan is automated, stakeholders trust roadmap decisions more.",
    stage: "VALIDATING",
    artifactType: "MOCKUP",
    artifactUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    artifactLabel: "Concept mockup",
    owner: "Alex",
    decisionDate: new Date().toISOString(),
    published: true,
    roadmapLinks: [],
  },
  {
    id: "stub-concept-2",
    title: "Roadmap Storyline View",
    summary: "A narrative mode that explains what shipped, what is next, and why.",
    problem: "Exec and cross-functional teams need concise weekly product narrative updates.",
    howItWorks: "Generates a one-page storyline from roadmap item changes and status transitions.",
    whyValuable: "Improves confidence and reduces status update churn in Slack.",
    validationPlan: "Run with two leadership reviews and track follow-up clarification asks.",
    hypothesis: "Narrative summaries improve alignment faster than raw board views.",
    stage: "EXPLORING",
    artifactType: "MOCKUP",
    artifactUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    artifactLabel: "Storyline concept",
    owner: "Priya",
    decisionDate: null,
    published: true,
    roadmapLinks: [],
  },
]

const STAGE_LABELS: Record<ConceptStage, string> = {
  EXPLORING: "Exploring",
  VALIDATING: "Validating",
  PLANNED: "Planned",
}

export default function ConceptsEditorView() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const canEdit = session?.user?.role === "ADMIN"
  const usingStubData = concepts.length === 0

  const displayConcepts = useMemo(() => {
    return concepts.length > 0 ? concepts : STUB_CONCEPTS
  }, [concepts])

  const roadmapItems = useMemo(() => {
    return roadmap?.sections.flatMap((section) => section.items) ?? []
  }, [roadmap])

  const loadData = async () => {
    const conceptsRes = await fetch("/api/concepts")
    if (conceptsRes.ok) {
      setConcepts(await conceptsRes.json())
    }

    if (canEdit) {
      const roadmapRes = await fetch(`/api/roadmap?year=${new Date().getFullYear()}`)
      if (roadmapRes.ok) {
        setRoadmap(await roadmapRes.json())
      }
    }
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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canEdit) return

    if (!form.artifactUrl.trim()) {
      toast({ title: "Image required", description: "Each concept must include at least one image URL.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...form,
        artifactUrl: form.artifactUrl.trim(),
        artifactLabel: form.artifactLabel || null,
        owner: form.owner || null,
        decisionDate: form.decisionDate ? new Date(form.decisionDate).toISOString() : null,
      }

      const response = await fetch("/api/concepts", {
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
      toast({ title: "Saved", description: "Concept updated." })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save concept",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (concept: Concept) => {
    if (concept.id.startsWith("stub-")) return
    setEditingId(concept.id)
    setShowForm(true)
    setForm({
      title: concept.title,
      summary: concept.summary,
      problem: concept.problem,
      howItWorks: concept.howItWorks,
      whyValuable: concept.whyValuable,
      validationPlan: concept.validationPlan,
      hypothesis: concept.hypothesis,
      stage: concept.stage,
      artifactType: concept.artifactType,
      artifactUrl: concept.artifactUrl,
      artifactLabel: concept.artifactLabel || "",
      owner: concept.owner || "",
      decisionDate: concept.decisionDate ? new Date(concept.decisionDate).toISOString().slice(0, 16) : "",
      published: concept.published,
      roadmapItemIds: concept.roadmapLinks.map((link) => link.itemId),
    })
  }

  const togglePublish = async (concept: Concept) => {
    if (!canEdit || concept.id.startsWith("stub-")) return
    const response = await fetch("/api/concepts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: concept.id, published: !concept.published }),
    })
    if (response.ok) {
      await loadData()
    }
  }

  const remove = async (conceptId: string) => {
    if (!canEdit || conceptId.startsWith("stub-") || !confirm("Delete this concept?")) return
    const response = await fetch(`/api/concepts?conceptId=${conceptId}`, {
      method: "DELETE",
    })
    if (response.ok) {
      await loadData()
      if (editingId === conceptId) {
        resetForm()
      }
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white">
          <div className="container mx-auto flex items-center justify-between px-6 py-3">
            <p className="text-sm text-gray-700">Preview mode: this is the view-only concepts experience.</p>
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              Exit Preview
            </Button>
          </div>
        </div>
        <PublicConceptsView />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Concept Lookbook</h1>
            <p className="text-sm text-gray-600">Explore concept tiles and open full-page details for what, why, and validation approach.</p>
          </div>
          <MainNav />
        </div>
      </header>

      <main className="container mx-auto space-y-5 px-6 py-6">
        {usingStubData && (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Showing sample concepts. Add real concepts to replace this placeholder data.
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Concepts</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(true)}>
              Preview View-Only
            </Button>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm())
                  setShowForm((prev) => !prev)
                }}
              >
                {showForm ? "Close" : "Add New Concept"}
              </Button>
            )}
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayConcepts.map((concept) => (
            <button
              key={concept.id}
              onClick={() => {
                setSelectedConcept(concept)
                setIsFlipped(false)
              }}
              className="overflow-hidden rounded border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={concept.artifactUrl} alt={concept.title} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{concept.title}</h3>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{STAGE_LABELS[concept.stage]}</span>
                </div>
                <p className="line-clamp-2 text-sm text-gray-700">{concept.summary}</p>
              </div>
            </button>
          ))}
        </section>

        {canEdit && showForm && (
          <section className="rounded border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">{editingId ? "Edit concept" : "Add concept"}</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="owner">Owner</Label>
                  <Input id="owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">One-line description</Label>
                <Input id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
              </div>

              <div>
                <Label htmlFor="problem">What it is</Label>
                <Textarea id="problem" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} rows={3} required />
              </div>

              <div>
                <Label htmlFor="howItWorks">How it works</Label>
                <Textarea id="howItWorks" value={form.howItWorks} onChange={(e) => setForm({ ...form, howItWorks: e.target.value })} rows={3} required />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="whyValuable">Why it is valuable</Label>
                  <Textarea id="whyValuable" value={form.whyValuable} onChange={(e) => setForm({ ...form, whyValuable: e.target.value })} rows={3} required />
                </div>
                <div>
                  <Label htmlFor="validationPlan">How we are figuring it out</Label>
                  <Textarea id="validationPlan" value={form.validationPlan} onChange={(e) => setForm({ ...form, validationPlan: e.target.value })} rows={3} required />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <select id="stage" className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as ConceptStage })}>
                    <option value="EXPLORING">Exploring</option>
                    <option value="VALIDATING">Validating</option>
                    <option value="PLANNED">Planned</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="artifactType">Asset Type</Label>
                  <select id="artifactType" className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm" value={form.artifactType} onChange={(e) => setForm({ ...form, artifactType: e.target.value as ConceptArtifactType })}>
                    <option value="MOCKUP">Mockup Image</option>
                    <option value="PROTOTYPE">Prototype Link</option>
                    <option value="DOC">Doc</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="decisionDate">Decision target</Label>
                  <Input id="decisionDate" type="datetime-local" value={form.decisionDate} onChange={(e) => setForm({ ...form, decisionDate: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="artifactUrl">Primary image URL (required)</Label>
                  <Input id="artifactUrl" type="url" value={form.artifactUrl} onChange={(e) => setForm({ ...form, artifactUrl: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="artifactLabel">Image caption</Label>
                  <Input id="artifactLabel" value={form.artifactLabel} onChange={(e) => setForm({ ...form, artifactLabel: e.target.value })} />
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

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
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

        {canEdit && displayConcepts.length > 0 && (
          <section className="rounded border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">Concept Admin Actions</h3>
            <div className="space-y-2">
              {displayConcepts.map((concept) => (
                <div key={concept.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                  <span>{concept.title}</span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(concept)} disabled={concept.id.startsWith("stub-")}>Edit</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => togglePublish(concept)} disabled={concept.id.startsWith("stub-")}>
                      {concept.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => remove(concept.id)} disabled={concept.id.startsWith("stub-")}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {selectedConcept && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="mx-auto h-full max-w-6xl [perspective:1400px]">
            <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
              <div className="absolute inset-0 overflow-hidden rounded-lg bg-white [backface-visibility:hidden]">
                <div className="relative h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedConcept.artifactUrl} alt={selectedConcept.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-white">
                    <h2 className="text-3xl font-bold">{selectedConcept.title}</h2>
                    <p className="mt-2 max-w-3xl text-lg">{selectedConcept.summary}</p>
                    <div className="mt-5 flex gap-3">
                      <Button onClick={() => setIsFlipped(true)}>Flip For Full Details</Button>
                      <Button variant="outline" onClick={() => setSelectedConcept(null)}>Close</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 overflow-auto rounded-lg bg-white p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="mx-auto max-w-4xl space-y-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-3xl font-bold">{selectedConcept.title}</h2>
                    <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700">{STAGE_LABELS[selectedConcept.stage]}</span>
                  </div>

                  <section>
                    <h3 className="text-lg font-semibold">What it is</h3>
                    <p className="mt-1 text-gray-700">{selectedConcept.problem}</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold">How it works</h3>
                    <p className="mt-1 text-gray-700">{selectedConcept.howItWorks}</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold">Why it is valuable</h3>
                    <p className="mt-1 text-gray-700">{selectedConcept.whyValuable}</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold">How we are figuring it out</h3>
                    <p className="mt-1 text-gray-700">{selectedConcept.validationPlan}</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold">Linked roadmap work</h3>
                    {selectedConcept.roadmapLinks.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedConcept.roadmapLinks.map((link) => (
                          <span key={`${selectedConcept.id}-${link.itemId}`} className="rounded bg-blue-100 px-2 py-1 text-sm text-blue-800">
                            {link.item.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-600">No linked roadmap items yet.</p>
                    )}
                  </section>

                  <div className="pt-2">
                    <Button variant="outline" onClick={() => setIsFlipped(false)}>Back To Tile Front</Button>
                    <Button className="ml-2" variant="outline" onClick={() => setSelectedConcept(null)}>Close</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
