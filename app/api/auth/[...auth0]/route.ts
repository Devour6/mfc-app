import { handleAuth, handleLogin, handleCallback } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Custom callback to create user in database after Auth0 authentication
const afterCallback = async (req: NextRequest, session: any) => {
  if (session?.user) {
    const { sub: auth0Id, email, name } = session.user
    
    try {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { auth0Id }
      })
      
      if (!user) {
        // Create new user with starting credits
        user = await prisma.user.create({
          data: {
            auth0Id,
            email,
            name,
            credits: 1000.0, // Starting credits
          }
        })
        console.log('Created new user:', user.id)
      }
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }
  
  return session
}

export const GET = handleAuth({
  login: handleLogin(),
  callback: handleCallback({ afterCallback })
})