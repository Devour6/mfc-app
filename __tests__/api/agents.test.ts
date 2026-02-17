/**
 * @jest-environment node
 */
import { mockPrisma, createRequest } from './helpers'

import { POST as registerAgent, registrationLimiter } from '@/app/api/agents/register/route'

beforeEach(() => {
  jest.clearAllMocks()
  registrationLimiter.reset()
})

// ─── Agent Registration ─────────────────────────────────────────────────────

describe('POST /api/agents/register', () => {
  beforeEach(() => {
    // Default: $transaction executes the callback and returns its result
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-agent-1',
      auth0Id: 'agent_abc123',
      email: 'agent_abc123@agent.mfc.gg',
      name: 'TestBot',
      credits: 1000,
      isAgent: true,
    })
    mockPrisma.agentProfile.create.mockResolvedValue({
      id: 'ap1',
      userId: 'u-agent-1',
      agentName: 'TestBot',
    })
    mockPrisma.apiKey.create.mockResolvedValue({
      id: 'ak1',
      key: 'mfc_sk_testkey',
      userId: 'u-agent-1',
    })
  })

  it('registers an agent and returns API key', async () => {
    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'TestBot', description: 'A test agent' }),
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.userId).toBe('u-agent-1')
    expect(data.agentName).toBe('TestBot')
    expect(data.apiKey).toMatch(/^mfc_sk_/)
    expect(data.credits).toBe(1000)
    expect(data.moltbookVerified).toBe(false)
  })

  it('creates user with isAgent=true', async () => {
    await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX' }),
      })
    )
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isAgent: true }),
      })
    )
  })

  it('creates AgentProfile with name and description', async () => {
    await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX', description: 'Does cool stuff' }),
      })
    )
    expect(mockPrisma.agentProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentName: 'AgentX',
          description: 'Does cool stuff',
        }),
      })
    )
  })

  it('creates ApiKey with mfc_sk_ prefix', async () => {
    await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX' }),
      })
    )
    expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          key: expect.stringMatching(/^mfc_sk_/),
          name: 'default',
        }),
      })
    )
  })

  it('generates unique agent auth0Id with agent_ prefix', async () => {
    await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX' }),
      })
    )
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          auth0Id: expect.stringMatching(/^agent_[a-f0-9]{32}$/),
          email: expect.stringMatching(/^agent_[a-f0-9]{32}@agent\.mfc\.gg$/),
        }),
      })
    )
  })

  it('returns 400 when name is missing', async () => {
    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is too short', async () => {
    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'A' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is too long', async () => {
    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'X'.repeat(51) }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('returns 409 when Moltbook agent already registered', async () => {
    // Mock fetch for Moltbook verification
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ agentId: 'molt-123' }),
    }) as any

    // Mock existing profile found
    mockPrisma.agentProfile.findUnique.mockResolvedValue({
      id: 'existing',
      moltbookId: 'molt-123',
    })

    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'DupeBot', moltbookToken: 'some-token' }),
      })
    )
    expect(res.status).toBe(409)
  })

  it('succeeds even when Moltbook verification fails', async () => {
    // Mock fetch throwing (Moltbook unreachable)
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error')) as any

    const res = await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX', moltbookToken: 'bad-token' }),
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.moltbookVerified).toBe(false)
  })

  it('uses a transaction for all DB operations', async () => {
    await registerAgent(
      createRequest('/api/agents/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'AgentX' }),
      })
    )
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
