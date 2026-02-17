import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { settleBetSchema } from '@/lib/validations'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/bets/:id — Get bet details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const bet = await prisma.bet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true } },
        fight: {
          include: {
            fighter1: { select: { id: true, name: true, emoji: true } },
            fighter2: { select: { id: true, name: true, emoji: true } },
            result: { select: { winnerId: true, method: true } },
          },
        },
        fighter: { select: { id: true, name: true, emoji: true } },
      },
    })

    if (!bet) return notFound('Bet')
    return jsonResponse(bet)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/bets/:id — Settle or cancel a bet
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const parsed = settleBetSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { status, payout } = parsed.data

    const existing = await prisma.bet.findUnique({ where: { id } })
    if (!existing) return notFound('Bet')
    if (existing.status !== 'PENDING') {
      return errorResponse(`Bet already settled with status: ${existing.status}`)
    }

    // Use transaction to settle bet and credit payout
    const bet = await prisma.$transaction(async (tx) => {
      const updated = await tx.bet.update({
        where: { id },
        data: {
          status,
          payout: payout ?? null,
          settledAt: new Date(),
        },
      })

      // Credit payout to user if bet won or refunded
      if ((status === 'WON' || status === 'REFUNDED') && payout && payout > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { credits: { increment: payout } },
        })
      }

      // Refund original amount on cancellation
      if (status === 'CANCELLED') {
        await tx.user.update({
          where: { id: existing.userId },
          data: { credits: { increment: existing.amount } },
        })
      }

      return updated
    })

    return jsonResponse(bet)
  } catch (error) {
    return serverError(error)
  }
}
