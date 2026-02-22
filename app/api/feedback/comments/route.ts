import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const createCommentSchema = z.object({
  feedbackId: z.string(),
  content: z.string().trim().min(1).max(2000),
})

const deleteCommentSchema = z.object({
  commentId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const feedbackId = request.nextUrl.searchParams.get("feedbackId")

    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId is required" }, { status: 400 })
    }

    const feedback = await prisma.feedbackEntry.findUnique({
      where: { id: feedbackId },
      select: { id: true, published: true },
    })

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    if (!feedback.published && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const comments = await prisma.feedbackComment.findMany({
      where: { feedbackId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching feedback comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { feedbackId, content } = createCommentSchema.parse(body)

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

    const comment = await prisma.feedbackComment.create({
      data: {
        feedbackId,
        content,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating feedback comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { commentId } = deleteCommentSchema.parse(body)

    const comment = await prisma.feedbackComment.findUnique({
      where: { id: commentId },
      include: {
        feedback: {
          select: {
            published: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const canDelete = session.user.role === "ADMIN" || comment.authorId === session.user.id
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.feedbackComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error deleting feedback comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
