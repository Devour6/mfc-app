import { NextResponse } from 'next/server'
import { stripe, getCreditPackage } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// POST /api/stripe/webhook — Handle Stripe webhook events
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      const packageId = session.metadata?.packageId
      const credits = Number(session.metadata?.credits)

      if (!userId || !packageId || !credits) {
        console.error('[Stripe Webhook] Missing metadata in checkout.session.completed', session.id)
        break
      }

      const pkg = getCreditPackage(packageId)
      if (!pkg) {
        console.error('[Stripe Webhook] Invalid package ID in metadata', packageId)
        break
      }

      // Credit the user's account
      try {
        await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, credits: true },
          })

          if (!user) {
            console.error('[Stripe Webhook] User not found', userId)
            return
          }

          await tx.user.update({
            where: { id: userId },
            data: { credits: user.credits + credits },
          })
        })
        console.log(`[Stripe Webhook] Credited ${credits} to user ${userId} (session ${session.id})`)
      } catch (err) {
        console.error('[Stripe Webhook] Failed to credit user', err)
      }
      break
    }

    default:
      // Unhandled event type — log but don't error
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
