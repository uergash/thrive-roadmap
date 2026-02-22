import type { FeedbackSource, FeedbackWorkflowStatus } from "@/types/insights"
import type { NormalizedFeedbackInput } from "@/lib/feedback/sync"

interface NotionPage {
  id: string
  url: string
  created_time: string
  last_edited_time: string
  properties: Record<string, unknown>
}

const mapFeedbackSource = (value: string | null | undefined): FeedbackSource => {
  const normalized = (value || "").toUpperCase()
  if (normalized === "INTERVIEW") return "INTERVIEW"
  if (normalized === "SUPPORT") return "SUPPORT"
  if (normalized === "SALES") return "SALES"
  if (normalized === "OTHER") return "OTHER"
  return "SLACK"
}

const mapWorkflowStatus = (value: string | null | undefined): FeedbackWorkflowStatus => {
  const normalized = (value || "").toUpperCase().replace(/\s+/g, "_")
  if (normalized === "TRIAGED") return "TRIAGED"
  if (normalized === "IN_PROGRESS") return "IN_PROGRESS"
  if (normalized === "ADDRESSED") return "ADDRESSED"
  return "NOT_STARTED"
}

const getRichText = (properties: Record<string, unknown>, ...keys: string[]): string => {
  for (const key of keys) {
    const prop = properties[key] as
      | { rich_text?: Array<{ plain_text?: string }>; title?: Array<{ plain_text?: string }> }
      | undefined
    if (!prop) continue
    const title = prop.title?.map((part) => part.plain_text || "").join("").trim()
    if (title) return title
    const rich = prop.rich_text?.map((part) => part.plain_text || "").join("").trim()
    if (rich) return rich
  }
  return ""
}

const getSelect = (properties: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const prop = properties[key] as { select?: { name?: string } } | undefined
    if (prop?.select?.name) return prop.select.name
  }
  return null
}

const getCheckbox = (properties: Record<string, unknown>, ...keys: string[]): boolean | null => {
  for (const key of keys) {
    const prop = properties[key] as { checkbox?: boolean } | undefined
    if (typeof prop?.checkbox === "boolean") return prop.checkbox
  }
  return null
}

const getNumber = (properties: Record<string, unknown>, ...keys: string[]): number | null => {
  for (const key of keys) {
    const prop = properties[key] as { number?: number | null } | undefined
    if (typeof prop?.number === "number") return prop.number
  }
  return null
}

const getDate = (properties: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const prop = properties[key] as { date?: { start?: string | null } } | undefined
    if (prop?.date?.start) return prop.date.start
  }
  return null
}

const getUrl = (properties: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const prop = properties[key] as { url?: string | null } | undefined
    if (prop?.url) return prop.url
  }
  return null
}

export async function fetchNotionFeedback(since: Date): Promise<NormalizedFeedbackInput[]> {
  const token = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_FEEDBACK_DATABASE_ID
  if (!token || !databaseId) return []

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 100,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      filter: {
        timestamp: "last_edited_time",
        last_edited_time: {
          on_or_after: since.toISOString(),
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Notion sync failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { results?: NotionPage[] }
  const results = payload.results || []

  return results.map((page) => {
    const properties = page.properties || {}
    const title = getRichText(properties, "Title", "Name", "Feedback") || "Untitled feedback"
    const summary = getRichText(properties, "Summary", "Description", "Details") || title
    const source = mapFeedbackSource(getSelect(properties, "Source"))
    const status = mapWorkflowStatus(getSelect(properties, "Status", "Workflow"))
    const urgency = Math.min(5, Math.max(1, getNumber(properties, "Urgency", "Priority") ?? 3))
    const published = getCheckbox(properties, "Published") ?? true
    const submittedBy = getRichText(properties, "Submitted By", "Reporter", "Team") || null
    const customerSegment = getRichText(properties, "Customer Segment", "Segment") || null
    const sourceRef = getUrl(properties, "Source Link", "Source URL") || page.url || null
    const jiraUrl = getUrl(properties, "JIRA", "Jira", "Jira URL")
    const isBeingAddressed = getCheckbox(properties, "Being Addressed", "Addressed") ?? false
    const receivedAt = getDate(properties, "Received At", "Date") || page.created_time

    return {
      externalSource: "NOTION" as const,
      externalId: page.id,
      rawSourceUrl: page.url || null,
      title,
      summary,
      submittedBy,
      source,
      sourceRef,
      customerSegment,
      isBeingAddressed,
      workflowStatus: status,
      jiraUrl: jiraUrl || null,
      urgency,
      receivedAt: new Date(receivedAt),
      published,
    }
  })
}
