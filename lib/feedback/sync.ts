import type { ExternalFeedbackSource } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { fetchNotionFeedback } from "@/lib/integrations/notion-feedback"
import { fetchSlackFeedback } from "@/lib/integrations/slack-feedback"
import type { FeedbackSource, FeedbackWorkflowStatus } from "@/types/insights"

export type NormalizedFeedbackInput = {
  externalSource: Exclude<ExternalFeedbackSource, "MANUAL">
  externalId: string
  rawSourceUrl: string | null
  title: string
  summary: string
  submittedBy: string | null
  source: FeedbackSource
  sourceRef: string | null
  customerSegment: string | null
  isBeingAddressed: boolean
  workflowStatus: FeedbackWorkflowStatus
  jiraUrl: string | null
  urgency: number
  receivedAt: Date
  published: boolean
}

export type FeedbackSyncResult = {
  created: number
  updated: number
  skipped: number
  errors: Array<{ source: string; externalId: string; message: string }>
}

const dedupeBySourceAndId = (entries: NormalizedFeedbackInput[]) => {
  const deduped = new Map<string, NormalizedFeedbackInput>()
  for (const entry of entries) {
    const key = `${entry.externalSource}:${entry.externalId}`
    const existing = deduped.get(key)
    if (!existing || entry.receivedAt > existing.receivedAt) {
      deduped.set(key, entry)
    }
  }
  return Array.from(deduped.values())
}

export async function runWeeklyFeedbackSync(daysBack = 8): Promise<FeedbackSyncResult> {
  const result: FeedbackSyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  const since = new Date()
  since.setDate(since.getDate() - Math.max(1, daysBack))

  const [notionEntries, slackEntries] = await Promise.all([
    fetchNotionFeedback(since),
    fetchSlackFeedback(since),
  ])

  const entries = dedupeBySourceAndId([...notionEntries, ...slackEntries])

  for (const entry of entries) {
    try {
      if (!entry.externalId || !entry.title || !entry.summary) {
        result.skipped += 1
        continue
      }

      const existing = await prisma.feedbackEntry.findFirst({
        where: {
          externalSource: entry.externalSource,
          externalId: entry.externalId,
        },
        select: { id: true },
      })

      await prisma.feedbackEntry.upsert({
        where: {
          externalSource_externalId: {
            externalSource: entry.externalSource,
            externalId: entry.externalId,
          },
        },
        update: {
          title: entry.title,
          summary: entry.summary,
          submittedBy: entry.submittedBy,
          source: entry.source,
          sourceRef: entry.sourceRef,
          customerSegment: entry.customerSegment,
          isBeingAddressed: entry.isBeingAddressed,
          workflowStatus: entry.workflowStatus,
          jiraUrl: entry.jiraUrl,
          urgency: entry.urgency,
          receivedAt: entry.receivedAt,
          published: entry.published,
          rawSourceUrl: entry.rawSourceUrl,
          lastSyncedAt: new Date(),
        },
        create: {
          externalSource: entry.externalSource,
          externalId: entry.externalId,
          rawSourceUrl: entry.rawSourceUrl,
          lastSyncedAt: new Date(),
          title: entry.title,
          summary: entry.summary,
          submittedBy: entry.submittedBy,
          source: entry.source,
          sourceRef: entry.sourceRef,
          customerSegment: entry.customerSegment,
          isBeingAddressed: entry.isBeingAddressed,
          workflowStatus: entry.workflowStatus,
          jiraUrl: entry.jiraUrl,
          urgency: entry.urgency,
          receivedAt: entry.receivedAt,
          published: entry.published,
        },
      })

      if (existing) {
        result.updated += 1
      } else {
        result.created += 1
      }
    } catch (error) {
      result.errors.push({
        source: entry.externalSource,
        externalId: entry.externalId,
        message: error instanceof Error ? error.message : "Unknown sync error",
      })
    }
  }

  return result
}
