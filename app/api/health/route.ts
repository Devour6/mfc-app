import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  let db: 'connected' | 'disconnected' = 'disconnected'

  try {
    await prisma.$queryRaw`SELECT 1`
    db = 'connected'
  } catch {
    // DB unreachable
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db,
  })
}
