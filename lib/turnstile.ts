/**
 * Cloudflare Turnstile server-side verification.
 *
 * In development: returns true when TURNSTILE_SECRET_KEY is not set,
 * so local dev works without Cloudflare credentials.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Dev mode — pass through when secret key not configured
  if (!secretKey) {
    return true
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    }
    if (remoteip) body.remoteip = remoteip

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return false

    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}
