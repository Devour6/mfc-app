import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function validationError(error: ZodError) {
  const issues = error.issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
  }))
  return NextResponse.json({ error: 'Validation failed', issues }, { status: 400 })
}

export function notFound(resource = 'Resource') {
  return errorResponse(`${resource} not found`, 404)
}

export function unauthorized() {
  return errorResponse('Unauthorized', 401)
}

export function serverError(error: unknown) {
  // Pass through auth errors as 401 responses
  if (error && typeof error === 'object' && 'response' in error && error.response instanceof NextResponse) {
    return error.response
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  console.error('[API Error]', error)
  return errorResponse(message, 500)
}
