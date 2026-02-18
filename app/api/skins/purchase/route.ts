import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { purchaseSkinSchema } from '@/lib/validations'
import { requireHuman } from '@/lib/role-guard'

// POST /api/skins/purchase — Buy a skin for a fighter (human only)
export async function POST(request: Request) {
  try {
    const dbUser = await requireHuman()

    const body = await request.json()
    const parsed = purchaseSkinSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { skinId, fighterId } = parsed.data

    // Verify skin exists
    const skin = await prisma.skin.findUnique({ where: { id: skinId } })
    if (!skin) return notFound('Skin')

    // Verify fighter exists
    const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } })
    if (!fighter) return notFound('Fighter')

    // Check if already purchased for this fighter
    const existing = await prisma.skinPurchase.findUnique({
      where: { userId_skinId_fighterId: { userId: dbUser.id, skinId, fighterId } },
    })
    if (existing) return errorResponse('You already own this skin for this fighter', 409)

    // Transaction: deduct credits + create purchase
    const purchase = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dbUser.id },
        select: { id: true, credits: true },
      })
      if (!user) throw new Error('User not found')
      if (user.credits < skin.priceCredits) throw new Error('Insufficient credits')

      await tx.user.update({
        where: { id: dbUser.id },
        data: { credits: { decrement: skin.priceCredits } },
      })

      return tx.skinPurchase.create({
        data: { userId: dbUser.id, skinId, fighterId, equipped: true },
        include: { skin: true },
      })
    })

    return jsonResponse(purchase, 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return errorResponse('Insufficient credits')
    }
    return serverError(error)
  }
}
