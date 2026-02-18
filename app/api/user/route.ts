import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { updateUserSchema } from '@/lib/validations'
import { requireAnyRole } from '@/lib/role-guard'

// GET /api/user — Get authenticated user's profile (both roles)
export async function GET() {
  try {
    const dbUser = await requireAnyRole()

    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        fighters: {
          where: { isActive: true },
          orderBy: { elo: 'desc' },
          select: { id: true, name: true, emoji: true, class: true, elo: true, wins: true, losses: true, draws: true },
        },
      },
    })

    if (!user) return notFound('User')
    return jsonResponse(user)
  } catch (error) {
    return serverError(error)
  }
}

// POST /api/user — Sync user on login (both roles)
export async function POST() {
  try {
    const user = await requireAnyRole()
    return jsonResponse(user)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/user — Update user settings (both roles)
export async function PATCH(request: Request) {
  try {
    const dbUser = await requireAnyRole()

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
