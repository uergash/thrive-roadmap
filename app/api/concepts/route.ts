import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const conceptSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  problem: z.string().min(1),
  howItWorks: z.string().min(1),
  whyValuable: z.string().min(1),
  validationPlan: z.string().min(1),
  hypothesis: z.string().min(1),
  stage: z.enum(["EXPLORING", "VALIDATING", "PLANNED"]),
  artifactType: z.enum(["MOCKUP", "PROTOTYPE", "DOC"]),
  artifactUrl: z.string().url(),
  artifactLabel: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  decisionDate: z.string().datetime().optional().nullable(),
  published: z.boolean().default(false),
  roadmapItemIds: z.array(z.string()).default([]),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const where = session?.user?.role === "ADMIN" ? {} : { published: true }

    const concepts = await prisma.concept.findMany({
      where,
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
    console.error("Error fetching concepts:", error)
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
    const data = conceptSchema.parse(body)

    const concept = await prisma.concept.create({
      data: {
        title: data.title,
        summary: data.summary,
        problem: data.problem,
        howItWorks: data.howItWorks,
        whyValuable: data.whyValuable,
        validationPlan: data.validationPlan,
        hypothesis: data.hypothesis,
        stage: data.stage,
        artifactType: data.artifactType,
        artifactUrl: data.artifactUrl,
        artifactLabel: data.artifactLabel ?? null,
        owner: data.owner ?? null,
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
        published: data.published,
        roadmapLinks: {
          create: data.roadmapItemIds.map((itemId) => ({ itemId })),
        },
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
    })

    return NextResponse.json(concept, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating concept:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

const conceptUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  problem: z.string().min(1).optional(),
  howItWorks: z.string().min(1).optional(),
  whyValuable: z.string().min(1).optional(),
  validationPlan: z.string().min(1).optional(),
  hypothesis: z.string().min(1).optional(),
  stage: z.enum(["EXPLORING", "VALIDATING", "PLANNED"]).optional(),
  artifactType: z.enum(["MOCKUP", "PROTOTYPE", "DOC"]).optional(),
  artifactUrl: z.string().url().optional(),
  artifactLabel: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  decisionDate: z.string().datetime().nullable().optional(),
  published: z.boolean().optional(),
  roadmapItemIds: z.array(z.string()).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = conceptUpdateSchema.parse(body)

    if (data.roadmapItemIds !== undefined) {
      await prisma.conceptRoadmapItem.deleteMany({
        where: { conceptId: data.id },
      })
    }

    const concept = await prisma.concept.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.problem !== undefined && { problem: data.problem }),
        ...(data.howItWorks !== undefined && { howItWorks: data.howItWorks }),
        ...(data.whyValuable !== undefined && { whyValuable: data.whyValuable }),
        ...(data.validationPlan !== undefined && { validationPlan: data.validationPlan }),
        ...(data.hypothesis !== undefined && { hypothesis: data.hypothesis }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.artifactType !== undefined && { artifactType: data.artifactType }),
        ...(data.artifactUrl !== undefined && { artifactUrl: data.artifactUrl }),
        ...(data.artifactLabel !== undefined && { artifactLabel: data.artifactLabel }),
        ...(data.owner !== undefined && { owner: data.owner }),
        ...(data.decisionDate !== undefined && {
          decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
        }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.roadmapItemIds !== undefined && {
          roadmapLinks: {
            create: data.roadmapItemIds.map((itemId) => ({ itemId })),
          },
        }),
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
    })

    return NextResponse.json(concept)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating concept:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conceptId = request.nextUrl.searchParams.get("conceptId")
    if (!conceptId) {
      return NextResponse.json({ error: "conceptId is required" }, { status: 400 })
    }

    await prisma.concept.delete({
      where: { id: conceptId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting concept:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
