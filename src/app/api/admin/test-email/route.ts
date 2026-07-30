import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'
import { emailService } from '@/lib/email-service'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/admin/test-email — Send a test email (admin only)
// Uses picasocode@gmail.com as the default test email
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
    } else if (type === 'order-placed') {
      // Send a test order placed email
      result = await emailService.sendOrderPlacedEmail(testEmail, {
        orderNumber: 'TEST-001',
        totalAmount: 599,
        items: 'NOTJUST Watr Fizz — Pre-Meal Wellness Shot x1',
      })
    } else if (type === 'order-confirmed') {
      // Send a test order confirmed email
      result = await emailService.sendOrderConfirmedEmail(testEmail, {
        orderNumber: 'TEST-001',
      })
    } else if (type === 'order-shipped') {
      // Send a test order shipped email
      result = await emailService.sendOrderShippedEmail(testEmail, {
        orderNumber: 'TEST-001',
      })
    } else if (type === 'order-delivered') {
      // Send a test order delivered email
      result = await emailService.sendOrderDeliveredEmail(testEmail, {
        orderNumber: 'TEST-001',
      })
    } else if (type === 'order-cancelled') {
      // Send a test order cancelled email
      result = await emailService.sendOrderCancelledEmail(testEmail, {
        orderNumber: 'TEST-001',
      })
    } else if (type === 'login') {
      // Send a test login notification email
      result = await emailService.sendLoginNotificationEmail(testEmail, {
        name: 'Test User',
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        device: 'Chrome on Windows',
      })
    } else {
      return errorResponse('Invalid email type. Use: otp, notification, password-reset, order-placed, order-confirmed, order-shipped, order-delivered, order-cancelled, login', 400)
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
