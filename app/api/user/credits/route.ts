import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { creditTransactionSchema } from '@/lib/validations'

// GET /api/user/credits?auth0Id=... — Get credit balance
export async function GET(request: NextRequest) {
  try {
    const auth0Id = request.nextUrl.searchParams.get('auth0Id')
    if (!auth0Id) return errorResponse('auth0Id is required')

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true, credits: true },
    })

    if (!user) return notFound('User')
    return jsonResponse({ credits: user.credits })
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/user/credits — Add or deduct credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = creditTransactionSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { auth0Id, amount, type, description } = parsed.data

    // Use a transaction to prevent race conditions
    const user = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { auth0Id },
        select: { id: true, credits: true },
      })

      if (!current) throw new Error('User not found')

      const newBalance = current.credits + amount
      if (newBalance < 0) throw new Error('Insufficient credits')

      return tx.user.update({
        where: { auth0Id },
        data: { credits: newBalance },
        select: { id: true, credits: true },
      })
    })

    return jsonResponse({
      credits: user.credits,
      transaction: { amount, type, description, timestamp: new Date().toISOString() },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return errorResponse('Insufficient credits', 400)
    }
    if (error instanceof Error && error.message === 'User not found') {
      return notFound('User')
    }
    return serverError(error)
  }
}
