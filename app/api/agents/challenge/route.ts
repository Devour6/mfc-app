import { generateChallenge } from '@/lib/reverse-captcha'
import { jsonResponse, serverError } from '@/lib/api-utils'

// GET /api/agents/challenge — Get a reverse CAPTCHA challenge for agent registration
export async function GET() {
  try {
    const { challengeId, challengeText } = generateChallenge()

    return jsonResponse({
      challengeId,
      challengeText,
      ttlSeconds: 30,
    })
  } catch (error) {
    return serverError(error)
  }
}
