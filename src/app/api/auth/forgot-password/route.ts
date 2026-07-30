import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'
import { emailService } from '@/lib/email-service'
import { smsAlertService } from '@/lib/smsalert-service'

// ─── Config ──────────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 5

// ─── Hash OTP ─────────────────────────────────────────────────
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// ─── Format Indian phone ──────────────────────────────────────
function formatIndianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1)
  if (cleaned.length !== 10) throw new Error('Invalid Indian mobile number')
  return cleaned
}

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/forgot-password — Request password reset OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    if (!email && !phone) {
      return errorResponse('Email or phone is required', 400)
    }

    // Find user by email or phone
    let user = null
    if (email) {
      user = await db.userProfile.findUnique({ where: { email } })
    } else if (phone) {
      try {
        const formattedPhone = formatIndianPhone(phone)
        user = await db.userProfile.findFirst({ where: { phone: formattedPhone } })
      } catch {
        user = await db.userProfile.findFirst({ where: { phone } })
      }
    }

    // Always return same message to prevent user enumeration
    if (!user) {
      return jsonResponse({
        success: true,
        message: 'If your email/phone is registered, you will receive a verification code.',
      })
    }

    // Invalidate any previous pending RESET_PASSWORD OTPs for this user
    await db.otpVerification.updateMany({
      where: { user_id: user.id, purpose: 'RESET_PASSWORD', status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = hashOtp(otpCode)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Determine phone for OTP record
    let phoneForRecord = user.phone || ''
    if (phone && !phoneForRecord) {
      try {
        phoneForRecord = formatIndianPhone(phone)
      } catch {
        phoneForRecord = phone.replace(/\D/g, '')
      }
    }

    // Create OtpVerification record
    const otpRecord = await db.otpVerification.create({
      data: {
        phone: phoneForRecord,
        otp_code: otpHash,
        purpose: 'RESET_PASSWORD',
        reference_id: user.id,
        user_id: user.id,
        status: 'PENDING',
        expires_at: expiresAt,
      },
    })

    // Send OTP via email if user has email
    let emailSent = false
    if (user.email) {
      try {
        const emailResult = await emailService.sendPasswordResetEmail(user.email, otpCode)
        emailSent = emailResult.success
        if (emailSent) {
          await db.otpVerification.update({
            where: { id: otpRecord.id },
            data: { sms_sent: true },
          })
        }
      } catch (err) {
        console.error('Failed to send reset OTP email:', err)
      }
    }

    // Also attempt SMS if user has phone and SMSALERT is active
    let smsSent = false
    if (user.phone) {
      const smsActive = process.env.SMSALERT_ACTIVE
      if (smsActive && smsActive === 'true') {
        try {
          const smsResult = await smsAlertService.sendSms(
            user.phone,
            `Your NOTJUST Watr password reset code is ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code. -NJWATR`
          )
          smsSent = smsResult.success
        } catch (err) {
          console.error('Failed to send reset OTP SMS:', err)
        }
      }
    }

    // If neither email nor SMS was sent, still return OTP code for notification
    if (!emailSent && !smsSent) {
      return jsonResponse({
        success: true,
        message: 'If your email/phone is registered, you will receive a verification code.',
        otp_id: otpRecord.id,
        otp_code: otpCode,  // Return OTP for frontend notification display
      })
    }

    const response = jsonResponse({
      success: true,
      message: 'If your email/phone is registered, you will receive a verification code.',
      otp_id: otpRecord.id,
      otp_code: otpCode,  // Return OTP for frontend notification display
    })

    return response
  } catch (error) {
    console.error('Error during forgot-password request:', error)
    return errorResponse('Failed to process password reset request', 500)
  }
}
