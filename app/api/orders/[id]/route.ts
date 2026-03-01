import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, errorResponse, notFound, serverError } from '@/lib/api-utils'
import { requireAnyRole } from '@/lib/role-guard'

/** Only OPEN or PARTIALLY_FILLED orders can be cancelled. */
const CANCELLABLE_STATUSES = new Set(['OPEN', 'PARTIALLY_FILLED'])

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/orders/:id — Get order details with fills
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAnyRole()
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        makerFills: true,
        takerFills: true,
      },
    })

    if (!order) return notFound('Order')
    if (order.userId !== dbUser.id) return notFound('Order')

    return jsonResponse(order)
  } catch (error) {
    return serverError(error)
  }
}

// DELETE /api/orders/:id — Cancel an open order, refund remaining credits
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const dbUser = await requireAnyRole()
    const { id } = await params

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return notFound('Order')
    if (order.userId !== dbUser.id) return notFound('Order')

    if (!CANCELLABLE_STATUSES.has(order.status)) {
      return errorResponse(
        `Cannot cancel order with status ${order.status}`,
        400
      )
    }

    const refundAmount = order.remainingQty * order.price

    const cancelled = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          remainingQty: 0,
        },
      })

      if (refundAmount > 0) {
        const updatedUser = await tx.user.update({
          where: { id: dbUser.id },
          data: { credits: { increment: refundAmount } },
        })

        await tx.creditTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'ORDER_CANCEL',
            amount: refundAmount,
            fee: 0,
            balanceAfter: updatedUser.credits,
            description: `Cancel order: refund ${order.remainingQty} × ${order.price}¢`,
            relatedId: order.id,
            relatedType: 'order',
          },
        })
      }

      return updated
    })

    return jsonResponse(cancelled)
  } catch (error) {
    return serverError(error)
  }
}
