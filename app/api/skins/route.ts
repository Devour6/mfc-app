import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, validationError, serverError } from '@/lib/api-utils'
import { skinQuerySchema } from '@/lib/validations'

// GET /api/skins — List available skins (public)
export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = skinQuerySchema.safeParse(raw)
    if (!parsed.success) return validationError(parsed.error)

    const { type, rarity, limit } = parsed.data
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (rarity) where.rarity = rarity

    const skins = await prisma.skin.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return jsonResponse(skins)
  } catch (error) {
    return serverError(error)
  }
}
