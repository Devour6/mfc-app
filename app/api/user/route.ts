import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { updateUserSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-guard'
import { ensureUser } from '@/lib/user-sync'

// GET /api/user — Get authenticated user's profile
export async function GET() {
  try {
    const session = await requireAuth()
    const dbUser = await ensureUser(session)

    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        fighters: {
          where: { isActive: true },
          orderBy: { elo: 'desc' },
        },
      },
    })

    if (!user) return notFound('User')
    return jsonResponse(user)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/user — Sync user on login (idempotent)
export async function POST() {
  try {
    const session = await requireAuth()
    const user = await ensureUser(session)
    return jsonResponse(user)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/user — Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth()
    const dbUser = await ensureUser(session)

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { name, username } = parsed.data

    const user = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
      },
    })

    return jsonResponse(user)
  } catch (error) {
    return serverError(error)
  }
}
