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

// POST /api/auth/forgot-password/verify — Verify password reset OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp_id, otp_code } = body

    if (!otp_id || !otp_code) {
      return errorResponse('otp_id and otp_code are required', 400)
    }

    const record = await db.otpVerification.findUnique({ where: { id: otp_id } })

    if (!record) {
      return errorResponse('OTP record not found', 404)
    }

    // Check purpose
    if (record.purpose !== 'RESET_PASSWORD') {
      return errorResponse('This OTP is not for password reset', 400)
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

    return jsonResponse({
      verified: true,
      user_id: record.user_id || record.reference_id,
      message: 'OTP verified successfully. You can now reset your password.',
    })
  } catch (error) {
    console.error('Error during forgot-password verification:', error)
    return errorResponse('Failed to verify OTP', 500)
  }
}
