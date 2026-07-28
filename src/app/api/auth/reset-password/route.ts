import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, hashPassword } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/reset-password — Reset password after OTP verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp_id, new_password, user_id } = body

    if (!otp_id || !new_password) {
      return errorResponse('otp_id and new_password are required', 400)
    }

    // Validate password
    if (typeof new_password !== 'string' || new_password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }

    // Find the OTP record
    const otpRecord = await db.otpVerification.findUnique({ where: { id: otp_id } })

    if (!otpRecord) {
      return errorResponse('OTP record not found', 404)
    }

    // Verify OTP is for RESET_PASSWORD and is VERIFIED
    if (otpRecord.purpose !== 'RESET_PASSWORD') {
      return errorResponse('This OTP is not for password reset', 400)
    }

    if (otpRecord.status !== 'VERIFIED') {
      return errorResponse('OTP has not been verified yet. Please verify the OTP first.', 400)
    }

    // Determine user_id from OTP record or request body
    const targetUserId = user_id || otpRecord.user_id || otpRecord.reference_id

    if (!targetUserId) {
      return errorResponse('Cannot determine which user to reset password for', 400)
    }

    // Verify the OTP record belongs to the target user
    if (otpRecord.user_id !== targetUserId && otpRecord.reference_id !== targetUserId) {
      return errorResponse('OTP does not belong to this user', 400)
    }

    // Find the user
    const user = await db.userProfile.findUnique({ where: { id: targetUserId } })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Hash the new password
    const passwordHash = hashPassword(new_password)

    // Update user's password
    await db.userProfile.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
    })

    // Mark OTP as consumed (re-purpose EXPIRED status)
    await db.otpVerification.update({
      where: { id: otp_id },
      data: { status: 'EXPIRED' },
    })

    return jsonResponse({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    })
  } catch (error) {
    console.error('Error during password reset:', error)
    return errorResponse('Failed to reset password', 500)
  }
}
