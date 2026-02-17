import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonResponse, notFound, validationError, serverError } from '@/lib/api-utils'
import { createUserSchema, updateUserSchema } from '@/lib/validations'

// GET /api/user?auth0Id=... — Get user profile
export async function GET(request: NextRequest) {
  try {
    const auth0Id = request.nextUrl.searchParams.get('auth0Id')
    if (!auth0Id) return validationError(
      createUserSchema.safeParse({}).error!
    )

    const user = await prisma.user.findUnique({
      where: { auth0Id },
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

// POST /api/user — Create new user (on first login)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { auth0Id, email, name } = parsed.data

    const existing = await prisma.user.findUnique({ where: { auth0Id } })
    if (existing) return jsonResponse(existing)

    const user = await prisma.user.create({
      data: { auth0Id, email, name },
      include: { fighters: true },
    })

    return jsonResponse(user, 201)
  } catch (error) {
    return serverError(error)
  }
}

// PATCH /api/user — Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { auth0Id, name, username } = parsed.data

    const user = await prisma.user.update({
      where: { auth0Id },
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
