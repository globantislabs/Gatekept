import { whatsappOtpService } from '@/lib/whatsapp-otp-service'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, stripSensitiveFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/whatsapp-otp/login — Login/register with verified WhatsApp OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp_id, phone, name } = body

    if (!otp_id || typeof otp_id !== 'string') {
      return errorResponse('OTP ID is required', 400)
    }

    if (!phone || typeof phone !== 'string') {
      return errorResponse('Phone number is required', 400)
    }

    const result = await whatsappOtpService.loginWithOtp(otp_id, phone, name)

    if (!result.success) {
      return errorResponse(result.message, 400)
    }

    // Create a simple session token
    const sessionToken = Buffer.from(`${result.user.id}:${Date.now()}`).toString('base64')

    const safeUser = stripSensitiveFields(result.user)

    const response = jsonResponse({
      success: result.success,
      user: safeUser,
      is_new: result.is_new,
      message: result.message,
    })

    // Set session cookies
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set('user_id', result.user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('WhatsApp OTP login error:', error)
    return errorResponse(error.message || 'Login failed', 500)
  }
}
