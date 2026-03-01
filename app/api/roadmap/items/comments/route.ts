import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const commentSchema = z.object({
  itemId: z.string(),
  content: z.string().min(1),
})

const updateCommentSchema = z.object({
  commentId: z.string(),
  content: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = commentSchema.parse(body)

    const comment = await prisma.itemComment.create({
      data: {
        itemId: data.itemId,
        content: data.content,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateCommentSchema.parse(body)

    const existingComment = await prisma.itemComment.findUnique({
      where: { id: data.commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (
      session.user.role !== "ADMIN" &&
      existingComment.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedComment = await prisma.itemComment.update({
      where: { id: data.commentId },
      data: { content: data.content },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 })
    }

    const existingComment = await prisma.itemComment.findUnique({
      where: { id: commentId },
    })

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (
      session.user.role !== "ADMIN" &&
      existingComment.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.itemComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
