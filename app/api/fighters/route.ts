import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, serverError } from '@/lib/api-utils'
import { createFighterSchema, fighterQuerySchema } from '@/lib/validations'

// GET /api/fighters?ownerId=...&class=...&active=true — List fighters
export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = fighterQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { ownerId, class: fighterClass, active } = parsed.data
    const where: Record<string, unknown> = {}
    if (ownerId) where.ownerId = ownerId
    if (fighterClass) where.class = fighterClass
    if (active !== undefined) where.isActive = active !== 'false'

    const fighters = await prisma.fighter.findMany({
      where,
      orderBy: { elo: 'desc' },
      include: { owner: { select: { id: true, name: true, username: true } } },
    })

    return jsonResponse(fighters)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/fighters — Create a new fighter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createFighterSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { name, emoji, fighterClass, ownerId } = parsed.data

    const fighter = await prisma.fighter.create({
      data: {
        name,
        emoji,
        class: fighterClass,
        ownerId,
      },
    })

    return jsonResponse(fighter, 201)
  } catch (error) {
    return serverError(error)
  }
}
