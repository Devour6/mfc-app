import { randomBytes, randomInt } from 'crypto'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Challenge {
  answer: number
  expiresAt: number // Date.now() ms
}

// ─── Store ──────────────────────────────────────────────────────────────────

const store = new Map<string, Challenge>()
const TTL_MS = 30_000 // 30 seconds

/** Reset store — only for tests */
export function _resetStore() {
  store.clear()
}

// Auto-prune expired challenges every 60s
let pruneInterval: ReturnType<typeof setInterval> | null = null
function ensurePruning() {
  if (pruneInterval) return
  pruneInterval = setInterval(() => {
    const now = Date.now()
    const expired: string[] = []
    store.forEach((challenge, id) => {
      if (challenge.expiresAt <= now) expired.push(id)
    })
    expired.forEach((id) => store.delete(id))
  }, 60_000)
  // Don't block process exit
  if (typeof pruneInterval === 'object' && 'unref' in pruneInterval) {
    pruneInterval.unref()
  }
}

// ─── Number words ───────────────────────────────────────────────────────────

const WORD_MAP: Record<number, string> = {
  0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
  5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
  10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen',
  15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen',
  20: 'twenty',
}

const OP_WORDS: Record<string, string> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'times',
}

function numberToWord(n: number): string {
  return WORD_MAP[n] ?? String(n)
}

// ─── Obfuscation ────────────────────────────────────────────────────────────

const GARBAGE_CHARS = '~#@^/!%}{&$?<>'

function alternatingCaps(text: string): string {
  let upper = Math.random() > 0.5
  return text
    .split('')
    .map((ch) => {
      if (/[a-z]/i.test(ch)) {
        const result = upper ? ch.toUpperCase() : ch.toLowerCase()
        upper = !upper
        return result
      }
      return ch
    })
    .join('')
}

function scatterGarbage(text: string): string {
  const chars = text.split('')
  const result: string[] = []

  for (const ch of chars) {
    // Random chance to insert garbage before/after each character
    if (Math.random() < 0.25) {
      result.push(GARBAGE_CHARS[randomInt(GARBAGE_CHARS.length)])
    }
    result.push(ch)
    if (Math.random() < 0.15) {
      result.push(GARBAGE_CHARS[randomInt(GARBAGE_CHARS.length)])
    }
  }

  return result.join('')
}

function scatterBrackets(text: string): string {
  const words = text.split(' ')
  return words
    .map((word) => {
      if (Math.random() < 0.3 && word.length > 2) {
        const pos = randomInt(1, word.length - 1)
        return word.slice(0, pos) + '[' + word.slice(pos) + ']'
      }
      return word
    })
    .join(' ')
}

// ─── Challenge generation ───────────────────────────────────────────────────

function generateMathProblem(): { text: string; answer: number } {
  const ops = ['+', '-', '*'] as const
  const op = ops[randomInt(ops.length)]

  let a: number, b: number, answer: number

  switch (op) {
    case '+':
      a = randomInt(1, 20)
      b = randomInt(1, 20)
      answer = a + b
      break
    case '-':
      a = randomInt(5, 20)
      b = randomInt(1, a) // ensure positive result
      answer = a - b
      break
    case '*':
      a = randomInt(2, 10)
      b = randomInt(2, 10)
      answer = a * b
      break
  }

  const text = `what is ${numberToWord(a)} ${OP_WORDS[op]} ${numberToWord(b)}`
  return { text, answer }
}

function obfuscate(text: string): string {
  let result = alternatingCaps(text)
  result = scatterBrackets(result)
  result = scatterGarbage(result)
  return result
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateChallenge(): { challengeId: string; challengeText: string } {
  ensurePruning()

  const { text, answer } = generateMathProblem()
  const challengeId = randomBytes(16).toString('hex')
  const challengeText = obfuscate(text)

  store.set(challengeId, {
    answer,
    expiresAt: Date.now() + TTL_MS,
  })

  return { challengeId, challengeText }
}

export function validateChallenge(
  challengeId: string,
  answer: number
): { valid: boolean; error?: string } {
  const challenge = store.get(challengeId)

  if (!challenge) {
    return { valid: false, error: 'Unknown or already used challenge' }
  }

  // One-time use: delete immediately
  store.delete(challengeId)

  if (Date.now() > challenge.expiresAt) {
    return { valid: false, error: 'Challenge expired' }
  }

  if (answer !== challenge.answer) {
    return { valid: false, error: 'Incorrect answer' }
  }

  return { valid: true }
}
