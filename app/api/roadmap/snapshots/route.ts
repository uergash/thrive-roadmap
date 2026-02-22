import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const snapshotSchema = z.object({
  roadmapId: z.string(),
  name: z.string().min(1),
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

    const snapshots = await prisma.roadmapSnapshot.findMany({
      where: { roadmapId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error("Error fetching snapshots:", error)
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
    const data = snapshotSchema.parse(body)

    const roadmap = await prisma.roadmap.findUnique({
      where: { id: data.roadmapId },
      include: {
        sections: {
          include: {
            items: {
              include: {
                quarters: true,
                jiraLinks: true,
                dependencies: {
                  include: {
                    dependsOn: {
                      select: { id: true, name: true, sectionId: true },
                    },
                  },
                },
                comments: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!roadmap) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      )
    }

    const snapshot = await prisma.roadmapSnapshot.create({
      data: {
        roadmapId: data.roadmapId,
        name: data.name,
        data: roadmap as unknown as object,
      },
    })

    return NextResponse.json(snapshot, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating snapshot:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
