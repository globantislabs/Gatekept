import { NextRequest } from 'next/server'
import { emailService } from '@/lib/email-service'
import { jsonResponse, errorResponse } from '@/lib/api-utils'

// POST /api/test-email — Send a test email (for verifying SMTP config)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, type } = body

    if (!to || typeof to !== 'string') {
      return errorResponse('Email address is required', 400)
    }

    const isConfigured = emailService.isConfigured()

    if (!isConfigured) {
      return errorResponse('Email service is not configured. Set ZOHO_EMAIL and ZOHO_PASSWORD in environment variables.', 503)
    }

    if (type === 'otp') {
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const result = await emailService.sendOtpEmail(to, testOtp)
      return jsonResponse({
        success: result.success,
        message: result.message,
      })
    }

    if (type === 'reset') {
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
      const result = await emailService.sendPasswordResetEmail(to, testOtp)
      return jsonResponse({
        success: result.success,
        message: result.message,
      })
    }

    // Default: notification email
    const result = await emailService.sendNotificationEmail(
      to,
      'NOTJUST Watr — Test Email',
      'This is a test email from NOTJUST Watr. If you received this, email delivery is working correctly!'
    )
    return jsonResponse({
      success: result.success,
      message: result.message,
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    return errorResponse(error.message || 'Failed to send test email', 500)
  }
}
