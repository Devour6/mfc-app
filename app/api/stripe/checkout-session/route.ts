import { stripe, getCreditPackage } from '@/lib/stripe'
import { jsonResponse, errorResponse, validationError, serverError } from '@/lib/api-utils'
import { checkoutSessionSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// POST /api/stripe/checkout-session — Create a Stripe Checkout Session (both roles)
export async function POST(request: Request) {
  try {
    const dbUser = await requireAnyRole()

    const body = await request.json()
    const parsed = checkoutSessionSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { packageId } = parsed.data
    const pkg = getCreditPackage(packageId)
    if (!pkg) return errorResponse('Invalid package ID', 400)

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pkg.label,
              description: `${pkg.credits} MFC Credits`,
            },
            unit_amount: pkg.priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: dbUser.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits?cancelled=true`,
    })

    return jsonResponse({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error) {
    return serverError(error)
  }
}
