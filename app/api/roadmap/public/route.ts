import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Public route - no auth required when roadmap is published
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : new Date().getFullYear()

    const roadmap = await prisma.roadmap.findFirst({
      where: { year, published: true },
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
              },
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!roadmap) {
      return NextResponse.json(
        { error: "No published roadmap found for this year" },
        { status: 404 }
      )
    }

    return NextResponse.json(roadmap)
  } catch (error) {
    console.error("Error fetching public roadmap:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
