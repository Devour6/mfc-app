import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { creditTransactionSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// GET /api/user/credits — Get authenticated user's credit balance (both roles)
export async function GET() {
  try {
    const dbUser = await requireAnyRole()

    return jsonResponse({ credits: dbUser.credits })
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/user/credits — Add or deduct credits (both roles)
export async function POST(request: Request) {
  try {
    const dbUser = await requireAnyRole()

    const body = await request.json()
    const parsed = creditTransactionSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { amount, type, description } = parsed.data

    // Use a transaction to prevent race conditions
    const user = await prisma.$transaction(async (tx: any) => {
      const current = await tx.user.findUnique({
        where: { id: dbUser.id },
        select: { id: true, credits: true },
      })

      if (!current) throw new Error('User not found')

      const newBalance = current.credits + amount
      if (newBalance < 0) throw new Error('Insufficient credits')

      return tx.user.update({
        where: { id: dbUser.id },
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
