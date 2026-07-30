// NOTJUST Watr — WhatsApp OTP Service
// Backend-only module for sending/verifying OTPs via WhatsApp Business API
// NEVER import this in client-side code

import { db } from '@/lib/db'
import { createHash } from 'crypto'

// ─── Config ──────────────────────────────────────────────────
// Lazy env var reading — these are read at CALL TIME, not import time,
// so they work correctly when the server loads .env.production at startup.
function getWhatsappToken() { return process.env.WHATSAPP_TOKEN || '' }
function getWhatsappPhoneNumberId() { return process.env.WHATSAPP_PHONE_NUMBER_ID || '' }
const WHATSAPP_API_VERSION = 'v19.0'
function getWhatsappBaseUrl() {
  const phoneId = getWhatsappPhoneNumberId()
  return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`
}
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5

// ─── Types ───────────────────────────────────────────────────
export type WhatsAppOtpPurpose = 'WHATSAPP_LOGIN' | 'RESET_PASSWORD'

interface WhatsAppApiResponse {
  messaging_product?: string
  message_id?: string
  error?: {
    code: number
    message: string
    type: string
  }
  [key: string]: unknown
}

// ─── Internal Helpers ────────────────────────────────────────

// Hash OTP for storage (never store plaintext)
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// Format Indian mobile number for WhatsApp
// Accepts 10-digit Indian numbers, adds 91 prefix for WhatsApp
function formatPhoneForWhatsApp(phone: string): { whatsapp: string; local: string } {
  let cleaned = phone.replace(/\D/g, '')

  // If starts with 91 and is 12 digits, strip the 91
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  }
  // If starts with 0 and is 11 digits, strip the 0
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  }

  if (cleaned.length !== 10) {
    throw new Error(`Invalid Indian mobile number: must be 10 digits, got ${cleaned.length}`)
  }

  return {
    whatsapp: `91${cleaned}`,  // WhatsApp format: 91XXXXXXXXXX
    local: cleaned,             // Local format: XXXXXXXXXX
  }
}

// Mask phone number for display (e.g. "91****78" or "****78")
function maskPhone(phone: string): string {
  if (phone.length < 4) return '****'
  return phone.slice(0, 2) + '****' + phone.slice(-2)
}

// ─── WhatsApp API Call ──────────────────────────────────────

async function sendWhatsAppOtpMessage(
  whatsappPhone: string,
  otpCode: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = getWhatsappToken()
  const phoneId = getWhatsappPhoneNumberId()
  if (!token || !phoneId) {
    console.warn('[WhatsApp OTP] Credentials not configured — OTP not sent via WhatsApp. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment.')
    return { success: false, error: 'WhatsApp credentials not configured' }
  }

  // Build the exact payload format as specified
  const payload = {
    messaging_product: 'whatsapp',
    to: whatsappPhone,
    type: 'template',
    template: {
      name: 'otp_verification',
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: otpCode },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            { type: 'text', text: otpCode },
          ],
        },
      ],
    },
  }

  try {
    const baseUrl = getWhatsappBaseUrl()
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data: WhatsAppApiResponse = await response.json()

    if (data.error) {
      console.error('WhatsApp API error:', data.error.message)
      return { success: false, error: data.error.message }
    }

    if (data.message_id) {
      return { success: true, messageId: data.message_id }
    }

    // If no error but no message_id either — might still be success
    return { success: response.ok, messageId: data.message_id }
  } catch (error: any) {
    console.error('WhatsApp API request failed:', error.message)
    return { success: false, error: error.message }
  }
}

// ─── Public Service ──────────────────────────────────────────

export const whatsappOtpService = {
  /**
   * Send OTP to a mobile number via WhatsApp Business API
   * Creates an OtpVerification record in the database with hashed OTP
   * If WhatsApp credentials are not configured, still creates record for dev/testing
   */
  async sendOtp(
    phone: string,
    purpose: WhatsAppOtpPurpose = 'WHATSAPP_LOGIN'
  ): Promise<{ success: boolean; otp_id: string; message: string; phone_masked: string }> {
    const { whatsapp, local } = formatPhoneForWhatsApp(phone)
    const phoneMasked = maskPhone(local)

    // Invalidate any previous pending OTPs for this phone+purpose combo
    await db.otpVerification.updateMany({
      where: { phone: local, purpose, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = hashOtp(otpCode)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Create database record
    const otpRecord = await db.otpVerification.create({
      data: {
        phone: local,
        otp_code: otpHash,
        purpose,
        status: 'PENDING',
        expires_at: expiresAt,
      },
    })

    // Attempt to send via WhatsApp
    const waResult = await sendWhatsAppOtpMessage(whatsapp, otpCode)

    if (waResult.success) {
      await db.otpVerification.update({
        where: { id: otpRecord.id },
        data: { sms_sent: true, sms_reference: waResult.messageId || null },
      })
      return {
        success: true,
        otp_id: otpRecord.id,
        message: 'WhatsApp OTP sent successfully',
        phone_masked: `+91 ${phoneMasked}`,
      }
    }

    // If WhatsApp failed or credentials not configured, still return OTP ID
    // NEVER expose the OTP code in the response — security risk!
    // The user should receive the OTP only via WhatsApp message.
    const isDev = !getWhatsappToken() || !getWhatsappPhoneNumberId()
    if (isDev) {
      console.warn(`[WhatsApp OTP] DEV MODE: OTP for ${phoneMasked} is ${otpCode}. Configure WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID for production.`)
    }
    return {
      success: true,
      otp_id: otpRecord.id,
      message: isDev
        ? 'OTP recorded. WhatsApp not configured — check server logs for dev OTP code.'
        : 'OTP recorded. WhatsApp delivery may be delayed.',
      phone_masked: `+91 ${phoneMasked}`,
    }
  },

  /**
   * Verify an OTP code entered by the user
   * Validates against database record, checks expiry, and attempt limits
   */
  async verifyOtp(
    otpId: string,
    otpCode: string
  ): Promise<{ success: boolean; message: string }> {
    const record = await db.otpVerification.findUnique({ where: { id: otpId } })

    if (!record) return { success: false, message: 'OTP record not found' }
    if (record.status === 'VERIFIED') return { success: false, message: 'OTP already used' }
    if (record.status === 'EXPIRED') return { success: false, message: 'OTP has expired' }
    if (record.status === 'FAILED') return { success: false, message: 'OTP has failed (too many attempts)' }

    // Check expiration
    if (new Date() > record.expires_at) {
      await db.otpVerification.update({ where: { id: otpId }, data: { status: 'EXPIRED' } })
      return { success: false, message: 'OTP has expired. Please request a new one.' }
    }

    // Check attempt limit
    if (record.attempts >= record.max_attempts) {
      await db.otpVerification.update({ where: { id: otpId }, data: { status: 'FAILED' } })
      return { success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' }
    }

    // Increment attempt counter
    await db.otpVerification.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    })

    // Verify OTP hash
    const inputHash = hashOtp(otpCode)
    if (inputHash !== record.otp_code) {
      const remaining = record.max_attempts - record.attempts - 1
      return { success: false, message: `Invalid OTP code. ${remaining} attempts remaining.` }
    }

    // Mark as verified
    await db.otpVerification.update({
      where: { id: otpId },
      data: { status: 'VERIFIED', verified_at: new Date() },
    })

    return { success: true, message: 'OTP verified successfully' }
  },

  /**
   * Login or register a user using a verified OTP
   * Finds existing user by phone or creates a new one
   * Requires a successfully verified OTP record
   */
  async loginWithOtp(
    otpId: string,
    phone: string,
    name?: string
  ): Promise<{ success: boolean; user: any; is_new: boolean; message: string }> {
    // Verify the OTP record is actually verified
    const otpRecord = await db.otpVerification.findUnique({ where: { id: otpId } })

    if (!otpRecord) {
      return { success: false, user: null, is_new: false, message: 'OTP record not found' }
    }
    if (otpRecord.status !== 'VERIFIED') {
      return { success: false, user: null, is_new: false, message: 'OTP has not been verified yet' }
    }

    // Format phone for lookup
    const { local } = formatPhoneForWhatsApp(phone)

    // Try to find existing user by phone
    let user = await db.userProfile.findFirst({
      where: { phone: local },
    })

    let isNew = false

    if (!user) {
      // Create new user with phone number
      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      user = await db.userProfile.create({
        data: {
          user_id: userId,
          name: name || `User ${local}`,
          phone: local,
          country: 'India',
          is_admin: false,
          learning_completed: false,
        },
      })
      isNew = true
    } else if (name && name.trim()) {
      // Update name if provided and different
      if (user.name !== name.trim()) {
        user = await db.userProfile.update({
          where: { id: user.id },
          data: { name: name.trim() },
        })
      }
    }

    // Strip password_hash from user object
    const safeUser = {
      ...user,
      password_hash: undefined,
    }

    return {
      success: true,
      user: safeUser,
      is_new: isNew,
      message: isNew ? 'Account created successfully' : 'Login successful',
    }
  },
}
