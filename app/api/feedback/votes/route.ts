import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const voteSchema = z.object({
  feedbackId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
})

const removeSchema = z.object({
  feedbackId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { feedbackId, value } = voteSchema.parse(body)

    const feedback = await prisma.feedbackEntry.findUnique({
      where: { id: feedbackId },
      select: { id: true, published: true },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    if (!feedback.published && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.feedbackVote.upsert({
      where: {
        feedbackId_userId: {
          feedbackId,
          userId: session.user.id,
        },
      },
      update: { value },
      create: {
        feedbackId,
        userId: session.user.id,
        value,
      },
    })

    const voteScoreResult = await prisma.feedbackVote.aggregate({
      where: { feedbackId },
      _sum: { value: true },
    })

    return NextResponse.json({
      success: true,
      voteScore: voteScoreResult._sum.value ?? 0,
      userVote: value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error voting feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { feedbackId } = removeSchema.parse(body)

    await prisma.feedbackVote.deleteMany({
      where: {
        feedbackId,
        userId: session.user.id,
      },
    })

    const voteScoreResult = await prisma.feedbackVote.aggregate({
      where: { feedbackId },
      _sum: { value: true },
    })

    return NextResponse.json({
      success: true,
      voteScore: voteScoreResult._sum.value ?? 0,
      userVote: 0,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error removing feedback vote:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
