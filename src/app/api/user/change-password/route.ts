import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, hashPassword, verifyPassword } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/user/change-password — Change own password (authenticated user)
// Requires x-user-id header to identify the user
export async function POST(request: NextRequest) {
  try {
    // Get user ID from header (set by client from logged-in state)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return errorResponse('Unauthorized: User ID required', 401)
    }

    // Find the user
    const user = await db.userProfile.findUnique({
      where: { id: userId },
      select: { id: true, password_hash: true },
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate new password is provided
    if (!newPassword || typeof newPassword !== 'string') {
      return errorResponse('newPassword is required', 400)
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400)
    }

    // If user has no password_hash (WhatsApp OTP-only users), allow setting password if currentPassword is empty
    if (!user.password_hash) {
      // OTP-only user: allow setting a password for the first time
      if (currentPassword && currentPassword.length > 0) {
        return errorResponse('No password is currently set for this account. Leave currentPassword empty to set a new password.', 400)
      }

      // Set the new password
      const passwordHash = hashPassword(newPassword)
      await db.userProfile.update({
        where: { id: userId },
        data: { password_hash: passwordHash },
      })

      return jsonResponse({ success: true, message: 'Password has been set successfully' })
    }

    // User has an existing password: verify current password
    if (!currentPassword || typeof currentPassword !== 'string') {
      return errorResponse('currentPassword is required', 400)
    }

    if (!verifyPassword(currentPassword, user.password_hash)) {
      return errorResponse('Current password is incorrect', 401)
    }

    // Hash and update the new password
    const passwordHash = hashPassword(newPassword)
    await db.userProfile.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    })

    return jsonResponse({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return errorResponse('Failed to change password', 500)
  }
}
