import type { NormalizedFeedbackInput } from "@/lib/feedback/sync"

interface SlackHistoryMessage {
  type?: string
  user?: string
  text?: string
  ts?: string
  subtype?: string
}

interface SlackHistoryResponse {
  ok: boolean
  error?: string
  messages?: SlackHistoryMessage[]
}

const toSafeText = (value: string | undefined): string => {
  return (value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const toDateFromTs = (ts: string): Date => {
  const unix = Number(ts.split(".")[0])
  return Number.isFinite(unix) ? new Date(unix * 1000) : new Date()
}

export async function fetchSlackFeedback(since: Date): Promise<NormalizedFeedbackInput[]> {
  const token = process.env.SLACK_BOT_TOKEN
  const channels = (process.env.SLACK_FEEDBACK_CHANNEL_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)

  if (!token || channels.length === 0) return []

  const oldestSeconds = Math.floor(since.getTime() / 1000)
  const entries: NormalizedFeedbackInput[] = []

  for (const channel of channels) {
    const url = new URL("https://slack.com/api/conversations.history")
    url.searchParams.set("channel", channel)
    url.searchParams.set("oldest", String(oldestSeconds))
    url.searchParams.set("limit", "200")
    url.searchParams.set("inclusive", "true")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Slack sync failed with status ${response.status}`)
    }

    const payload = (await response.json()) as SlackHistoryResponse
    if (!payload.ok) {
      throw new Error(`Slack sync failed: ${payload.error || "unknown error"}`)
    }

    const messages = payload.messages || []
    for (const message of messages) {
      if (!message.ts || !message.text) continue
      if (message.subtype) continue
      const summary = toSafeText(message.text)
      if (!summary) continue

      const title = summary.length > 80 ? `${summary.slice(0, 77)}...` : summary
      const messageDate = toDateFromTs(message.ts)

      entries.push({
        externalSource: "SLACK",
        externalId: `${channel}:${message.ts}`,
        rawSourceUrl: null,
        title,
        summary,
        submittedBy: message.user ? `Slack user ${message.user}` : null,
        source: "SLACK",
        sourceRef: null,
        customerSegment: null,
        isBeingAddressed: false,
        workflowStatus: "NOT_STARTED",
        jiraUrl: null,
        urgency: 3,
        receivedAt: messageDate,
        published: true,
      })
    }
  }

  return entries
}
