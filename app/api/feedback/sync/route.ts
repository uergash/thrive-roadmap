import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { runWeeklyFeedbackSync } from "@/lib/feedback/sync"

const hasValidSyncToken = (request: NextRequest) => {
  const configuredToken = process.env.FEEDBACK_SYNC_TOKEN
  if (!configuredToken) return false

  const headerToken = request.headers.get("x-feedback-sync-token")
  if (headerToken && headerToken === configuredToken) return true

  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return false
  return authHeader.slice("Bearer ".length) === configuredToken
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === "ADMIN"
    const isTokenAuthorized = hasValidSyncToken(request)

    if (!isAdmin && !isTokenAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const daysBack = Number.isFinite(body?.daysBack)
      ? Math.min(30, Math.max(1, Number(body.daysBack)))
      : 8

    const result = await runWeeklyFeedbackSync(daysBack)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error syncing feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
