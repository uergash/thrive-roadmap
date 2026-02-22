import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const concepts = await prisma.concept.findMany({
      where: {
        published: true,
      },
      include: {
        roadmapLinks: {
          include: {
            item: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
      },
      orderBy: [{ stage: "asc" }, { updatedAt: "desc" }],
      take: 200,
    })

    return NextResponse.json(concepts)
  } catch (error) {
    console.error("Error fetching public concepts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
