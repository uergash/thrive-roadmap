import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const roadmapSchema = z.object({
  year: z.number().int().min(2020).max(2100),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : new Date().getFullYear()

    const include = {
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
            orderBy: { order: "asc" as const },
          },
        },
        orderBy: { order: "asc" as const },
      },
    }

    let roadmap = await prisma.roadmap.findFirst({
      where: { year },
      include,
    })

    if (!roadmap) {
      roadmap = await prisma.roadmap.create({
        data: { year },
        include,
      })
    }

    return NextResponse.json(roadmap)
  } catch (error) {
    console.error("Error fetching roadmap:", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      {
        error: msg,
        hint: "If you see 'relation' or 'column' does not exist, run migration_risks_publish_changelog.sql in Supabase SQL Editor.",
      },
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
    const { roadmapId, published } = z
      .object({
        roadmapId: z.string(),
        published: z.boolean(),
      })
      .parse(body)

    const roadmap = await prisma.roadmap.update({
      where: { id: roadmapId },
      data: { published },
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
                changeLogs: {
                  orderBy: { createdAt: "desc" },
                  take: 20,
                },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(roadmap)
  } catch (error) {
    console.error("Error fetching roadmap:", error)
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
    const { year } = roadmapSchema.parse(body)

    const roadmap = await prisma.roadmap.create({
      data: {
        year,
      },
      include: {
        sections: {
          include: {
            items: {
              include: {
                quarters: true,
                jiraLinks: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(roadmap)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating roadmap:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
