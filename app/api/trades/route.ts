import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, serverError } from '@/lib/api-utils'
import { tradeQuerySchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// GET /api/trades — List user's trades with optional fightId filter
export async function GET(request: NextRequest) {
  try {
    const dbUser = await requireAnyRole()

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = tradeQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { fightId, limit } = parsed.data

    // User can be maker or taker — query both denormalized userId fields
    const where: Record<string, unknown> = {
      OR: [
        { makerUserId: dbUser.id },
        { takerUserId: dbUser.id },
      ],
    }
    if (fightId) where.fightId = fightId

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return jsonResponse(trades)
  } catch (error) {
    return serverError(error)
  }
}
