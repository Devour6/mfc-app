import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { updateBillingRequestSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-guard'
import { ensureUser } from '@/lib/user-sync'

type RouteParams = { params: Promise<{ id: string }> }

// PATCH /api/billing/requests/:id — Approve or reject (owner only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()
    const dbUser = await ensureUser(session)
    const { id } = await params

    if (dbUser.isAgent) {
      return errorResponse('Only owners can approve or reject billing requests', 403)
    }

    const body = await request.json()
    const parsed = updateBillingRequestSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { status } = parsed.data

    const existing = await prisma.billingRequest.findUnique({
      where: { id },
      include: {
        agent: { select: { userId: true } },
      },
    })

    if (!existing) return notFound('Billing request')
    if (existing.ownerId !== dbUser.id) {
      return errorResponse('You can only manage billing requests for your own agents', 403)
    }
    if (existing.status !== 'PENDING') {
      return errorResponse('This billing request has already been resolved', 400)
    }

    if (status === 'APPROVED') {
      // Transfer credits from owner to agent in a transaction
      const result = await prisma.$transaction(async (tx: any) => {
        // Check owner has enough credits
        const owner = await tx.user.findUnique({
          where: { id: dbUser.id },
          select: { credits: true },
        })
        if (!owner || owner.credits < existing.amount) {
          throw new Error('Insufficient credits')
        }

        // Deduct from owner
        await tx.user.update({
          where: { id: dbUser.id },
          data: { credits: { decrement: existing.amount } },
        })

        // Credit to agent
        await tx.user.update({
          where: { id: existing.agent.userId },
          data: { credits: { increment: existing.amount } },
        })

        // Update billing request
        return tx.billingRequest.update({
          where: { id },
          data: { status: 'PAID', resolvedAt: new Date() },
        })
      })

      return jsonResponse(result)
    } else {
      // REJECTED
      const result = await prisma.billingRequest.update({
        where: { id },
        data: { status: 'REJECTED', resolvedAt: new Date() },
      })

      return jsonResponse(result)
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return errorResponse('Insufficient credits to approve this request', 400)
    }
    return serverError(error)
  }
}
