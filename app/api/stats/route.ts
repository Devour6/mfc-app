import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [activeFighters, liveFights, volumeResult] = await Promise.all([
      prisma.fighter.count({ where: { isActive: true } }),
      prisma.fight.count({ where: { status: 'LIVE' } }),
      prisma.trade.aggregate({ _sum: { quantity: true } }),
    ])

    // Volume = sum of (price * quantity) across all trades
    // Since aggregate can't multiply columns, use raw query
    const volumeRaw = await prisma.$queryRaw<[{ total: bigint | null }]>`
      SELECT COALESCE(SUM(price * quantity), 0) AS total FROM trades
    `
    const totalVolumeCents = Number(volumeRaw[0]?.total ?? 0)

    return NextResponse.json({
      activeFighters,
      liveFights,
      totalVolumeCents,
    })
  } catch {
    return NextResponse.json(
      { activeFighters: 0, liveFights: 0, totalVolumeCents: 0 },
      { status: 200 }
    )
  }
}
