import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const itemSchema = z.object({
  sectionId: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  risk: z.string().nullable().optional(),
  blockerNotes: z.string().nullable().optional(),
  productBrief: z.string().nullable().optional(),
  designs: z.string().nullable().optional(),
  order: z.number().int().optional(),
  quarters: z.array(z.number().int().min(1).max(4)).optional(),
  year: z.number().int().optional(),
  jiraLinks: z.array(z.string()).optional(),
  dependsOnIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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

    const items = await prisma.item.findMany({
      where: { sectionId },
      include: {
        quarters: true,
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: true,
      },
      orderBy: {
        order: "asc",
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
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
    const data = itemSchema.parse(body)

    const itemCount = await prisma.item.count({
      where: { sectionId: data.sectionId },
    })

    const roadmap = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: { roadmap: true },
    })

    if (!roadmap) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      )
    }

    const year = data.year ?? roadmap.roadmap.year

    const item = await prisma.item.create({
      data: {
        sectionId: data.sectionId,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? "Not started",
        risk: data.risk ?? null,
        blockerNotes: data.blockerNotes ?? null,
        order: data.order ?? itemCount,
        quarters: {
          create: (data.quarters ?? []).map((quarter) => ({
            quarter,
            year,
          })),
        },
        dependencies: {
          create: (data.dependsOnIds ?? []).map((dependsOnId) => ({
            dependsOnId,
          })),
        },
      },
      include: {
        quarters: true,
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: true,
      },
    })

    await prisma.itemChangeLog.create({
      data: {
        itemId: item.id,
        changeType: "created",
        newValue: item.name,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating item:", error)
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
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      )
    }

    await prisma.item.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting item:", error)
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
    const updateSchema = z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      status: z.string().optional(),
      risk: z.string().nullable().optional(),
      blockerNotes: z.string().nullable().optional(),
      productBrief: z.string().nullable().optional(),
      designs: z.string().nullable().optional(),
      order: z.number().int().optional(),
      quarters: z.array(z.number().int().min(1).max(4)).optional(),
      year: z.number().int().optional(),
      jiraLinks: z.array(z.string()).optional(),
      dependsOnIds: z.array(z.string()).optional(),
    })

    const data = updateSchema.parse(body)

    const existingItem = await prisma.item.findUnique({
      where: { id: data.id },
      include: {
        quarters: true,
        section: {
          include: {
            roadmap: true,
          },
        },
      },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const year = data.year ?? existingItem.section.roadmap.year

    if (data.quarters !== undefined) {
      await prisma.quarter.deleteMany({
        where: { itemId: data.id },
      })
    }

    if (data.dependsOnIds !== undefined) {
      await prisma.itemDependency.deleteMany({
        where: { itemId: data.id },
      })
    }

    const item = await prisma.item.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.risk !== undefined && { risk: data.risk }),
        ...(data.blockerNotes !== undefined && { blockerNotes: data.blockerNotes }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.quarters !== undefined && {
          quarters: {
            create: data.quarters.map((quarter) => ({
              quarter,
              year,
            })),
          },
        }),
        ...(data.dependsOnIds !== undefined && {
          dependencies: {
            create: data.dependsOnIds.map((dependsOnId) => ({
              dependsOnId,
            })),
          },
        }),
      },
      include: {
        quarters: true,
        dependencies: {
          include: {
            dependsOn: {
              select: { id: true, name: true, sectionId: true },
            },
          },
        },
        comments: true,
      },
    })

    // Create change log entries
    if (data.name && data.name !== existingItem.name) {
      await prisma.itemChangeLog.create({
        data: {
          itemId: data.id,
          changeType: "name_changed",
          oldValue: existingItem.name,
          newValue: data.name,
          authorId: session.user.id,
        },
      })
    }
    if (data.status && data.status !== existingItem.status) {
      await prisma.itemChangeLog.create({
        data: {
          itemId: data.id,
          changeType: "status_changed",
          oldValue: existingItem.status,
          newValue: data.status,
          authorId: session.user.id,
        },
      })
    }
    if (data.quarters !== undefined) {
      const oldQuarters = existingItem.quarters.map((q: { quarter: number }) => q.quarter).sort().join(",")
      const newQuarters = data.quarters.sort().join(",")
      if (oldQuarters !== newQuarters) {
        await prisma.itemChangeLog.create({
          data: {
            itemId: data.id,
            changeType: "quarters_changed",
            oldValue: oldQuarters || null,
            newValue: newQuarters || null,
            authorId: session.user.id,
          },
        })
      }
    }
    if (data.risk !== undefined && data.risk !== existingItem.risk) {
      await prisma.itemChangeLog.create({
        data: {
          itemId: data.id,
          changeType: "risk_changed",
          oldValue: existingItem.risk,
          newValue: data.risk,
          authorId: session.user.id,
        },
      })
    }

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
