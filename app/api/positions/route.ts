import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, serverError } from '@/lib/api-utils'
import { positionQuerySchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// GET /api/positions — List user's positions with optional filters
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = positionQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, settled, limit } = parsed.data
    const where: Record<string, unknown> = { userId: dbUser.id }
    if (fightId) where.fightId = fightId
    if (settled !== undefined) where.settled = settled === 'true'

    const positions = await prisma.position.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return jsonResponse(positions)
  } catch (error) {
    return serverError(error)
  }
}
