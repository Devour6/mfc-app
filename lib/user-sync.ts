import { prisma } from '@/lib/prisma'

/**
 * Ensure a User record exists in the database for an authenticated session.
 * Creates the user on first login (upsert pattern).
 * Returns the User record with id and credits.
 */
export async function ensureUser(session: { user: { sub: string; name?: string; email?: string } }) {
  const { sub: auth0Id, name, email } = session.user

  const user = await prisma.user.upsert({
    where: { auth0Id },
    create: {
      auth0Id,
      name: name ?? null,
      email: email ?? `${auth0Id}@placeholder.mfc`,
    },
    update: {
      ...(name && { name }),
      ...(email && { email }),
    },
    select: { id: true, auth0Id: true, credits: true, username: true, isAgent: true },
  })

  return user
}
