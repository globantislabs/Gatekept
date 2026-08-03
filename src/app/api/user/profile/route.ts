import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, sanitizeString } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// PUT /api/user/profile — Update own profile (any logged-in user)
// Requires x-user-id header to identify the user
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from header (set by client from logged-in state)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return errorResponse('Unauthorized: User ID required', 401)
    }

    // Verify user exists
    const existing = await db.userProfile.findUnique({ where: { id: userId } })
    if (!existing) {
      return errorResponse('User not found', 404)
    }

    const body = await request.json()

    // Build update data — only allow safe fields
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) {
      const safeName = sanitizeString(body.name, 100)
      if (!safeName || safeName.trim().length === 0) {
        return errorResponse('Name cannot be empty', 400)
      }
      updateData.name = safeName.trim()
    }

    if (body.email !== undefined) {
      const safeEmail = body.email ? sanitizeString(body.email, 255).toLowerCase() : null
      // Check if email is already taken by another user
      if (safeEmail) {
        const emailTaken = await db.userProfile.findFirst({
          where: { email: safeEmail, id: { not: userId } }
        })
        if (emailTaken) {
          return errorResponse('This email is already used by another account', 409)
        }
      }
      updateData.email = safeEmail
    }

    if (body.phone !== undefined) {
      const safePhone = body.phone ? sanitizeString(body.phone, 20) : null
      // Check if phone is already taken by another user
      if (safePhone) {
        const phoneTaken = await db.userProfile.findFirst({
          where: { phone: safePhone, id: { not: userId } }
        })
        if (phoneTaken) {
          return errorResponse('This phone number is already used by another account', 409)
        }
      }
      updateData.phone = safePhone
    }

    if (body.age !== undefined) {
      updateData.age = body.age ? Number(body.age) : null
    }

    if (body.gender !== undefined) {
      updateData.gender = body.gender ? sanitizeString(body.gender, 20) : null
    }

    if (body.state !== undefined) {
      updateData.state = body.state ? sanitizeString(body.state, 50) : null
    }

    if (body.country !== undefined) {
      updateData.country = body.country ? sanitizeString(body.country, 50) : 'India'
    }

    // Update user
    const user = await db.userProfile.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        country: true,
        state: true,
        avatar_url: true,
        is_admin: true,
        learning_completed: true,
        created_at: true,
        updated_at: true,
        // Exclude password_hash
      },
    })

    return jsonResponse({ user })
  } catch (error: any) {
    console.error('Error updating user profile:', error)

    // Handle Prisma unique constraint errors with user-friendly messages
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'field'
      if (field === 'email') return errorResponse('This email is already used by another account', 409)
      if (field === 'phone') return errorResponse('This phone number is already used by another account', 409)
      return errorResponse(`This ${field} is already taken`, 409)
    }

    // Handle MySQL NOT NULL constraint errors
    if (error?.code === 'P2003' || error?.message?.includes('cannot be null')) {
      return errorResponse('A required field is missing. Please fill in all required fields.', 400)
    }

    return errorResponse('Failed to update profile. Please try again.', 500)
  }
}
