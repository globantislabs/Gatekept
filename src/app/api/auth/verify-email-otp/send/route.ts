import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { jsonResponse, errorResponse, handleOptions, sanitizeString } from '@/lib/api-utils'
import { emailService } from '@/lib/email-service'

// ─── Config ──────────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 5

// ─── Hash OTP ─────────────────────────────────────────────────
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/verify-email-otp/send — Send email OTP for registration verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return errorResponse('Email address is required', 400)
    }

    const safeEmail = sanitizeString(email, 255).toLowerCase()

    // Basic email validation
    if (!safeEmail.includes('@') || !safeEmail.includes('.')) {
      return errorResponse('Please enter a valid email address', 400)
    }

    // Check if user already exists with this email
    const existingUser = await db.userProfile.findUnique({ where: { email: safeEmail } })
    if (existingUser) {
      return errorResponse('This email is already registered. Please login instead.', 409)
    }

    // Invalidate any previous pending VERIFY_EMAIL OTPs for this email
    await db.otpVerification.updateMany({
      where: { phone: safeEmail, purpose: 'VERIFY_EMAIL', status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = hashOtp(otpCode)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Create OtpVerification record
    // Note: we store email in the 'phone' field since the OtpVerification schema
    // uses 'phone' as the primary identifier field. For email OTP, we store the email there.
    const otpRecord = await db.otpVerification.create({
      data: {
        phone: safeEmail,
        otp_code: otpHash,
        purpose: 'VERIFY_EMAIL',
        status: 'PENDING',
        expires_at: expiresAt,
      },
    })

    // Send OTP via email
    let emailSent = false
    try {
      const emailResult = await emailService.sendOtpEmail(safeEmail, otpCode)
      emailSent = emailResult.success
      if (emailSent) {
        await db.otpVerification.update({
          where: { id: otpRecord.id },
          data: { sms_sent: true },
        })
      }
    } catch (err) {
      console.error('Failed to send verification OTP email:', err)
    }

    // If email actually sent, return success
    if (emailSent) {
      return jsonResponse({
        success: true,
        otp_id: otpRecord.id,
        message: 'Verification code sent to your email.',
      })
    }

    // Email not configured or failed — return error with clear message
    return errorResponse(
      'Email service is not configured. Please set ZOHO_EMAIL and ZOHO_PASSWORD environment variables to enable email verification.',
      503,
    )
  } catch (error) {
    console.error('Error during email OTP send:', error)
    return errorResponse('Failed to send verification code', 500)
  }
}
