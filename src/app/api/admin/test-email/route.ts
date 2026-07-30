import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'
import { emailService } from '@/lib/email-service'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/admin/test-email — Send a test email (admin only)
// Uses picasocode@gmail.com as the test email when running from admin panel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type = 'otp' } = body

    // Default test email
    const testEmail = email || 'picasocode@gmail.com'

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return errorResponse('Email service is not configured. Set ZOHO_EMAIL and ZOHO_PASSWORD in environment variables.', 503)
    }

    let result

    if (type === 'otp') {
      // Send a test OTP email
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
      result = await emailService.sendOtpEmail(testEmail, testOtp)
    } else if (type === 'notification') {
      // Send a test notification email
      result = await emailService.sendNotificationEmail(
        testEmail,
        'Test Email from NOTJUST Watr',
        'This is a test email from the NOTJUST Watr admin panel. If you received this, the email service is working correctly!'
      )
    } else if (type === 'password-reset') {
      // Send a test password reset email
      const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
      result = await emailService.sendPasswordResetEmail(testEmail, testOtp)
    } else {
      return errorResponse('Invalid email type. Use "otp", "notification", or "password-reset".', 400)
    }

    if (result.success) {
      return jsonResponse({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        type,
        email: testEmail,
      })
    } else {
      return errorResponse(`Failed to send test email: ${result.message}`, 500)
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return errorResponse('Failed to send test email', 500)
  }
}
