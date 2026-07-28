import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// ─── Hash OTP ─────────────────────────────────────────────────
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/verify-email-otp/verify — Verify email OTP for registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp_id, otp_code, email } = body

    if (!otp_id || !otp_code) {
      return errorResponse('otp_id and otp_code are required', 400)
    }

    if (otp_code.length !== 6) {
      return errorResponse('OTP code must be 6 digits', 400)
    }

    const record = await db.otpVerification.findUnique({ where: { id: otp_id } })

    if (!record) {
      return errorResponse('OTP record not found', 404)
    }

    // Check purpose
    if (record.purpose !== 'VERIFY_EMAIL') {
      return errorResponse('This OTP is not for email verification', 400)
    }

    // Check status
    if (record.status === 'VERIFIED') {
      return errorResponse('OTP already used', 400)
    }
    if (record.status === 'EXPIRED') {
      return errorResponse('OTP has expired. Please request a new one.', 400)
    }
    if (record.status === 'FAILED') {
      return errorResponse('OTP has failed (too many attempts)', 400)
    }

    // Check expiration
    if (new Date() > record.expires_at) {
      await db.otpVerification.update({
        where: { id: otp_id },
        data: { status: 'EXPIRED' },
      })
      return errorResponse('OTP has expired. Please request a new one.', 400)
    }

    // Check attempt limit
    if (record.attempts >= record.max_attempts) {
      await db.otpVerification.update({
        where: { id: otp_id },
        data: { status: 'FAILED' },
      })
      return errorResponse('Maximum attempts exceeded. Please request a new OTP.', 400)
    }

    // Increment attempt counter
    await db.otpVerification.update({
      where: { id: otp_id },
      data: { attempts: { increment: 1 } },
    })

    // Verify OTP hash
    const inputHash = hashOtp(otp_code)
    if (inputHash !== record.otp_code) {
      const remaining = record.max_attempts - record.attempts - 1
      return errorResponse(`Invalid OTP code. ${remaining} attempts remaining.`, 400)
    }

    // Mark as verified
    await db.otpVerification.update({
      where: { id: otp_id },
      data: { status: 'VERIFIED', verified_at: new Date() },
    })

    // Optionally verify email matches the OTP record
    if (email && record.phone !== email.toLowerCase()) {
      return errorResponse('Email does not match the verified address', 400)
    }

    // Check if user already exists with this email (might have registered while OTP was pending)
    const existingUser = await db.userProfile.findUnique({ where: { email: record.phone } })

    return jsonResponse({
      verified: true,
      email: record.phone,
      user_exists: !!existingUser,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Error during email OTP verification:', error)
    return errorResponse('Failed to verify OTP', 500)
  }
}
