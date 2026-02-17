import { jsonResponse, errorResponse } from '@/lib/api-utils'

export async function GET() {
  const treasuryWallet = process.env.MFC_TREASURY_WALLET

  if (!treasuryWallet) {
    return errorResponse('Treasury wallet not configured', 503)
  }

  return jsonResponse({
    treasuryWallet,
    creditsPerSol: Number(process.env.MFC_CREDITS_PER_SOL) || 1000,
  })
}
