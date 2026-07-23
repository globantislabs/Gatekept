import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

// ─── CORS Headers ────────────────────────────────────────────
// Environment-aware CORS: restrict to same-origin in production
function getAllowedOrigin(): string {
  if (process.env.NODE_ENV === 'production') {
    // In production, only allow same-origin requests
    return '' // Empty = same-origin only (browser default)
  }
  // In development, allow all origins for testing convenience
  return '*'
}

export function getCorsHeaders(): Record<string, string> {
  const origin = getAllowedOrigin()
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key, X-User-Id',
    'Access-Control-Max-Age': '86400', // 24 hours cache for preflight
  }
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

// Apply CORS headers to any response
export function withCors(response: NextResponse) {
  Object.entries(getCorsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Create a JSON response with CORS headers
export function jsonResponse(data: unknown, status: number = 200) {
  return withCors(NextResponse.json(data, { status }))
}

// Create an error response with CORS headers
export function errorResponse(message: string, status: number = 500) {
  return jsonResponse({ error: message }, status)
}

// Handle OPTIONS request for CORS preflight
export function handleOptions() {
  return withCors(new NextResponse(null, { status: 204 }))
}

// ─── Password Hashing ────────────────────────────────────────
// SHA-256 hashing for password storage and verification

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const inputHash = hashPassword(password)
  return inputHash === storedHash
}

// ─── Sensitive Data Stripping ─────────────────────────────────

// Strip password_hash and other sensitive fields from any user profile object
export function stripSensitiveFields<T extends Record<string, unknown>>(user: T): Omit<T, 'password_hash'> {
  const { password_hash, ...safeUser } = user
  return safeUser as Omit<T, 'password_hash'>
}

// Strip password_hash from an array of user profiles
export function stripSensitiveFieldsFromArray<T extends Record<string, unknown>>(users: T[]): Omit<T, 'password_hash'>[] {
  return users.map(stripSensitiveFields)
}

// ─── Admin Verification ───────────────────────────────────────
// Secure admin check: require BOTH x-admin-key AND x-user-id headers,
// then verify from database that the user is actually an admin.
// This avoids consuming the request body stream (which can only be read once).

export async function checkAdmin(request: Request): Promise<boolean> {
  // Step 1: Check for admin key header (acts as a request intent flag)
  const adminKey = request.headers.get('x-admin-key')
  if (!adminKey) {
    return false
  }

  // Step 2: Get user_id from the x-user-id header only (not body, to avoid stream consumption)
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return false
  }

  // Step 3: Verify the user exists and is an admin in the database
  try {
    const user = await db.userProfile.findUnique({
      where: { id: userId },
      select: { is_admin: true },
    })

    if (!user || !user.is_admin) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error verifying admin status:', error)
    return false
  }
}

// ─── Input Validation ─────────────────────────────────────────

// Sanitize a string input: trim whitespace and limit length
export function sanitizeString(value: string, maxLength: number = 255): string {
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength)
  }
  return trimmed
}

// Validate that required fields exist and are non-empty
export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      return `${field} is required`
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      return `${field} cannot be empty`
    }
  }
  return null
}

// Validate numeric fields
export function validateNumeric(
  data: Record<string, unknown>,
  rules: Record<string, { min?: number; max?: number; integer?: boolean }>
): string | null {
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    if (value === undefined || value === null) continue // skip if not provided

    const num = Number(value)
    if (isNaN(num)) {
      return `${field} must be a valid number`
    }
    if (rule.min !== undefined && num < rule.min) {
      return `${field} must be at least ${rule.min}`
    }
    if (rule.max !== undefined && num > rule.max) {
      return `${field} must be at most ${rule.max}`
    }
    if (rule.integer && !Number.isInteger(num)) {
      return `${field} must be an integer`
    }
  }
  return null
}

// Validate and sanitize string fields
export function sanitizeStringFields(
  data: Record<string, unknown>,
  fields: string[],
  maxLength: number = 255
): Record<string, unknown> {
  const sanitized = { ...data }
  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field] as string, maxLength)
    }
  }
  return sanitized
}
