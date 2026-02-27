import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sectionSchema = z.object({
  roadmapId: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const roadmapId = searchParams.get("roadmapId")

    if (!roadmapId) {
      return NextResponse.json(
        { error: "roadmapId is required" },
        { status: 400 }
      )
    }

    const sections = await prisma.section.findMany({
      where: { roadmapId },
      include: {
        items: {
          include: {
            quarters: true,

          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = sectionSchema.parse(body)

    const sectionCount = await prisma.section.count({
      where: { roadmapId: data.roadmapId },
    })

    const section = await prisma.section.create({
      data: {
        roadmapId: data.roadmapId,
        name: data.name,
        description: data.description ?? null,
        order: data.order ?? sectionCount,
      },
      include: {
        items: {
          include: {
            quarters: true,

          },
        },
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating section:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const sectionId = searchParams.get("sectionId")

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 }
      )
    }

    await prisma.section.delete({
      where: { id: sectionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, order } = z
      .object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        order: z.number().int().optional(),
      })
      .parse(body)

    const section = await prisma.section.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
      },
      include: {
        items: {
          include: {
            quarters: true,

          },
        },
      },
    })

    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating section:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
