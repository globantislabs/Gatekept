import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, sanitizeString } from '@/lib/api-utils'

// ─── Format Indian phone ──────────────────────────────────────
function formatIndianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1)
  return cleaned
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/check-user — Check if a user exists by email or phone
// Used during registration to detect existing users and redirect to login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    if (!email && !phone) {
      return errorResponse('Email or phone is required', 400)
    }

    let existingUser = null

    if (email) {
      const safeEmail = sanitizeString(email, 255).toLowerCase()
      existingUser = await db.userProfile.findUnique({ where: { email: safeEmail } })
    }

    if (phone && !existingUser) {
      const rawPhone = sanitizeString(phone, 20)
      // Try formatted version first, then raw
      try {
        const formatted = formatIndianPhone(rawPhone)
        existingUser = await db.userProfile.findFirst({ where: { phone: formatted } })
      } catch {
        existingUser = await db.userProfile.findFirst({ where: { phone: rawPhone.replace(/\D/g, '') } })
      }
      // Also try with the original input
      if (!existingUser) {
        existingUser = await db.userProfile.findFirst({ where: { phone: rawPhone } })
      }
    }

    return jsonResponse({
      exists: !!existingUser,
      user_id: existingUser?.id || null,
      name: existingUser?.name || null,
      email: existingUser?.email || null,
      phone: existingUser?.phone || null,
    })
  } catch (error) {
    console.error('Error during check-user:', error)
    return errorResponse('Failed to check user', 500)
  }
}
