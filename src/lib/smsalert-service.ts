// NOTJUST Watr — SMSAlert.co.in Service
// Backend-only module for sending/verifying OTPs and SMS via SMSAlert API
// NEVER import this in client-side code

import { db } from '@/lib/db'
import { createHash } from 'crypto'

// ─── Config ──────────────────────────────────────────────────
// Lazy env var reading — these are read at CALL TIME, not import time,
// so they work correctly when the server loads .env.production at startup.
function getSmsAlertUser() { return process.env.SMSALERT_USER || '' }
function getSmsAlertPwd() { return process.env.SMSALERT_PWD || '' }
function getSmsAlertSender() { return process.env.SMSALERT_SENDER || 'NJWATR' }
function getSmsAlertActive() { return process.env.SMSALERT_ACTIVE || '' }
const SMSALERT_OTP_LENGTH = 6
const SMSALERT_OTP_EXPIRY_MINUTES = 5
const SMSALERT_BASE_URL = 'https://www.smsalert.co.in/api'

// ─── Types ───────────────────────────────────────────────────
export type OtpPurpose =
  | 'CANCEL_ORDER'
  | 'CANCEL_SUB'
  | 'PAUSE_SUB'
  | 'RESUME_SUB'
  | 'MODIFY_ADDRESS'
  | 'VERIFY_PHONE'

interface SmsAlertResponse {
  status: string
  message: string
  referenceid?: string
  error?: string
  [key: string]: unknown
}

// ─── Internal Helpers ────────────────────────────────────────

// Hash OTP for storage (never store plaintext)
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// Format Indian mobile number (strip +91, ensure 10 digits)
function formatIndianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1)
  if (cleaned.length !== 10) throw new Error(`Invalid Indian mobile number: must be 10 digits, got ${cleaned.length}`)
  return cleaned
}

// Mask phone number for display (e.g. "91****78")
function maskPhone(phone: string): string {
  if (phone.length < 4) return '****'
  return phone.slice(0, 2) + '****' + phone.slice(-2)
}

// ─── SMSAlert API Calls ──────────────────────────────────────

async function callSmsAlertApi(
  endpoint: string,
  params: Record<string, string>
): Promise<SmsAlertResponse> {
  const url = new URL(`${SMSALERT_BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    // Try to parse error JSON, fallback to status text
    const errBody = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(`SMSAlert API error: ${errBody.error || res.status}`)
  }

  // SMSAlert can return various response formats
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('json')) {
    return res.json()
  }
  // Some endpoints return plain text responses
  const text = await res.text()
  return { status: text.includes('success') ? 'success' : 'error', message: text }
}

// ─── Public Service ──────────────────────────────────────────

export const smsAlertService = {
  /**
   * Send OTP to a mobile number via SMSAlert mverify.json
   * Creates an OtpVerification record in the database with hashed OTP
   * If SMSAlert credentials are not configured, still creates record for dev/testing
   */
  async sendOtp(
    phone: string,
    purpose: OtpPurpose,
    userId?: string,
    referenceId?: string
  ): Promise<{ success: boolean; otpId: string; message: string; phoneMasked: string; otpCode?: string }> {
    // Check if SMS OTP is active
    const smsActive = getSmsAlertActive()
    if (!smsActive || smsActive === 'false') {
      throw new Error('SMS OTP is currently inactive. Please use WhatsApp OTP instead.')
    }

    const formattedPhone = formatIndianPhone(phone)
    const phoneMasked = maskPhone(formattedPhone)

    // Invalidate any previous pending OTPs for this phone+purpose combo
    await db.otpVerification.updateMany({
      where: { phone: formattedPhone, purpose, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = hashOtp(otpCode)
    const expiresAt = new Date(Date.now() + SMSALERT_OTP_EXPIRY_MINUTES * 60 * 1000)

    // Create database record
    const otpRecord = await db.otpVerification.create({
      data: {
        phone: formattedPhone,
        otp_code: otpHash,
        purpose,
        reference_id: referenceId,
        user_id: userId,
        status: 'PENDING',
        expires_at: expiresAt,
      },
    })

    // If SMSAlert credentials are configured, attempt to send SMS
    const smsUser = getSmsAlertUser()
    const smsPwd = getSmsAlertPwd()
    const smsSender = getSmsAlertSender()
    if (smsUser && smsPwd) {
      try {
        const smsTemplate = `Your NOTJUST Watr verification code is ${otpCode}. Valid for ${SMSALERT_OTP_EXPIRY_MINUTES} minutes. Do not share this code. -NJWATR`
        const response = await callSmsAlertApi('/mverify.json', {
          user: smsUser,
          pwd: smsPwd,
          sender: smsSender,
          mobileno: formattedPhone,
          otp: otpCode,
          otp_length: String(SMSALERT_OTP_LENGTH),
          template: smsTemplate,
        })

        const smsSuccess = response.status === 'success' || response.error === '' || response.referenceid
        if (smsSuccess) {
          await db.otpVerification.update({
            where: { id: otpRecord.id },
            data: { sms_sent: true, sms_reference: response.referenceid || null },
          })
          // Return OTP code for frontend notification display
          return { success: true, otpId: otpRecord.id, message: 'OTP sent successfully', phoneMasked, otpCode }
        }
      } catch (smsError: any) {
        console.warn('SMSAlert SMS delivery failed:', smsError.message)
      }
    }

    // In dev mode (no credentials) or if SMS failed, return OTP code for notification
    const isDev = !getSmsAlertUser() || !getSmsAlertPwd()
    if (isDev) {
      console.warn(`[SMS OTP] DEV MODE: OTP for ${phoneMasked} is ${otpCode}. Configure SMSALERT_USER and SMSALERT_PWD for production.`)
    }
    return {
      success: true,
      otpId: otpRecord.id,
      message: isDev
        ? 'OTP recorded. SMS not configured — OTP shown as notification.'
        : 'OTP recorded. SMS delivery may be delayed.',
      phoneMasked,
      otpCode,
    }
  },

  /**
   * Verify an OTP code entered by the user
   * Validates against database record, checks expiry, and attempt limits
   */
  async verifyOtp(
    otpId: string,
    otpCode: string
  ): Promise<{ success: boolean; message: string; verifiedPurpose?: OtpPurpose; referenceId?: string }> {
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

    // Also try SMSAlert verify endpoint (for their dashboard tracking)
    const smsUser = getSmsAlertUser()
    const smsPwd = getSmsAlertPwd()
    if (smsUser && smsPwd && record.sms_reference) {
      try {
        await callSmsAlertApi('/mverify.json', {
          user: smsUser,
          pwd: smsPwd,
          mobileno: record.phone,
          otp: otpCode,
          reference_id: record.sms_reference,
        })
      } catch { /* non-critical — our own verification is the authoritative one */ }
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      verifiedPurpose: record.purpose as OtpPurpose,
      referenceId: record.reference_id || undefined,
    }
  },

  /**
   * Send a plain SMS notification (order confirmation, delivery updates, etc.)
   */
  async sendSms(phone: string, text: string): Promise<{ success: boolean; message: string }> {
    const formattedPhone = formatIndianPhone(phone)

    const smsUser = getSmsAlertUser()
    const smsPwd = getSmsAlertPwd()
    const smsSender = getSmsAlertSender()
    if (!smsUser || !smsPwd) {
      console.warn('SMSAlert credentials not configured — SMS not sent')
      return { success: false, message: 'SMS gateway not configured' }
    }

    try {
      const response = await callSmsAlertApi('/push.json', {
        user: smsUser,
        pwd: smsPwd,
        sender: smsSender,
        mobileno: formattedPhone,
        text,
      })
      return { success: response.status === 'success', message: response.message }
    } catch (error: any) {
      console.error('SMSAlert push failed:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * Check if SMSAlert credentials are configured
   */
  isConfigured(): boolean {
    return Boolean(getSmsAlertUser() && getSmsAlertPwd())
  },
}
