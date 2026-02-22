import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const daysParam = Number.parseInt(request.nextUrl.searchParams.get("days") ?? "45", 10)
    const safeDays = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 365) : 45
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - safeDays)

    const feedback = await prisma.feedbackEntry.findMany({
      where: {
        published: true,
        receivedAt: {
          gte: fromDate,
        },
      },
      include: {
        theme: true,
        votes: {
          select: {
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
          take: 25,
        },
      },
      orderBy: [{ isBeingAddressed: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }],
      take: 300,
    })

    const payload = feedback.map((entry) => ({
      ...entry,
      votes: undefined,
      commentCount: entry.comments.length,
      voteScore: entry.votes.reduce((acc, vote) => acc + vote.value, 0),
      userVote: 0,
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error fetching public feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
