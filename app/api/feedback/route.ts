import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const feedbackSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  submittedBy: z.string().optional().nullable(),
  source: z.enum(["SLACK", "INTERVIEW", "SUPPORT", "SALES", "OTHER"]),
  sourceRef: z.string().url().optional().nullable(),
  customerSegment: z.string().optional().nullable(),
  isBeingAddressed: z.boolean().default(false),
  workflowStatus: z.enum(["NOT_STARTED", "TRIAGED", "IN_PROGRESS", "ADDRESSED"]).default("NOT_STARTED"),
  jiraUrl: z.string().url().optional().nullable(),
  urgency: z.number().int().min(1).max(5).default(3),
  receivedAt: z.string().datetime(),
  published: z.boolean().default(false),
  themeId: z.string().optional().nullable(),
  roadmapItemIds: z.array(z.string()).default([]),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const where = session?.user?.role === "ADMIN" ? {} : { published: true }

    const feedback = await prisma.feedbackEntry.findMany({
      where,
      include: {
        theme: true,
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
        roadmapLinks: {
          include: {
            item: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
      orderBy: [{ receivedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    })

    const payload = feedback.map((entry) => {
      const voteScore = entry.votes.reduce((acc, vote) => acc + vote.value, 0)
      const userVote = session?.user?.id
        ? entry.votes.find((vote) => vote.userId === session.user.id)?.value ?? 0
        : 0
      return {
        ...entry,
        votes: undefined,
        commentCount: entry.comments.length,
        voteScore,
        userVote,
      }
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = feedbackSchema.parse(body)

    const feedback = await prisma.feedbackEntry.create({
      data: {
        title: data.title,
        summary: data.summary,
        externalSource: "MANUAL",
        submittedBy: data.submittedBy ?? null,
        source: data.source,
        sourceRef: data.sourceRef ?? null,
        customerSegment: data.customerSegment ?? null,
        isBeingAddressed: data.isBeingAddressed,
        workflowStatus: data.workflowStatus,
        jiraUrl: data.jiraUrl ?? null,
        urgency: data.urgency,
        receivedAt: new Date(data.receivedAt),
        published: data.published,
        themeId: data.themeId ?? null,
        roadmapLinks: {
          create: data.roadmapItemIds.map((itemId) => ({ itemId })),
        },
      },
      include: {
        theme: true,
        roadmapLinks: {
          include: {
            item: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const feedbackUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  source: z.enum(["SLACK", "INTERVIEW", "SUPPORT", "SALES", "OTHER"]).optional(),
  sourceRef: z.string().url().nullable().optional(),
  customerSegment: z.string().nullable().optional(),
  submittedBy: z.string().nullable().optional(),
  isBeingAddressed: z.boolean().optional(),
  workflowStatus: z.enum(["NOT_STARTED", "TRIAGED", "IN_PROGRESS", "ADDRESSED"]).optional(),
  jiraUrl: z.string().url().nullable().optional(),
  urgency: z.number().int().min(1).max(5).optional(),
  receivedAt: z.string().datetime().optional(),
  published: z.boolean().optional(),
  themeId: z.string().nullable().optional(),
  roadmapItemIds: z.array(z.string()).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = feedbackUpdateSchema.parse(body)

    if (data.roadmapItemIds !== undefined) {
      await prisma.feedbackRoadmapItem.deleteMany({
        where: { feedbackId: data.id },
      })
    }

    const updated = await prisma.feedbackEntry.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.sourceRef !== undefined && { sourceRef: data.sourceRef }),
        ...(data.customerSegment !== undefined && {
          customerSegment: data.customerSegment,
        }),
        ...(data.submittedBy !== undefined && { submittedBy: data.submittedBy }),
        ...(data.isBeingAddressed !== undefined && { isBeingAddressed: data.isBeingAddressed }),
        ...(data.workflowStatus !== undefined && { workflowStatus: data.workflowStatus }),
        ...(data.jiraUrl !== undefined && { jiraUrl: data.jiraUrl }),
        ...(data.urgency !== undefined && { urgency: data.urgency }),
        ...(data.receivedAt !== undefined && {
          receivedAt: new Date(data.receivedAt),
        }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.themeId !== undefined && { themeId: data.themeId }),
        ...(data.roadmapItemIds !== undefined && {
          roadmapLinks: {
            create: data.roadmapItemIds.map((itemId) => ({ itemId })),
          },
        }),
      },
      include: {
        theme: true,
        roadmapLinks: {
          include: {
            item: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const feedbackId = request.nextUrl.searchParams.get("feedbackId")
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId is required" }, { status: 400 })
    }

    await prisma.feedbackEntry.delete({
      where: { id: feedbackId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
