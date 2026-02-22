import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const themeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  order: z.number().int().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const themes = await prisma.feedbackTheme.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(themes)
  } catch (error) {
    console.error("Error fetching themes:", error)
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
    const data = themeSchema.parse(body)

    const count = await prisma.feedbackTheme.count()

    const theme = await prisma.feedbackTheme.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        order: data.order ?? count,
      },
    })

    return NextResponse.json(theme, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
