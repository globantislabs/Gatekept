import { whatsappOtpService } from '@/lib/whatsapp-otp-service'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/whatsapp-otp/verify — Verify WhatsApp OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { otp_id, otp_code } = body

    if (!otp_id || typeof otp_id !== 'string') {
      return errorResponse('OTP ID is required', 400)
    }

    if (!otp_code || typeof otp_code !== 'string') {
      return errorResponse('OTP code is required', 400)
    }

    if (otp_code.length !== 6) {
      return errorResponse('OTP code must be 6 digits', 400)
    }

    const result = await whatsappOtpService.verifyOtp(otp_id, otp_code)

    return jsonResponse({
      success: result.success,
      message: result.message,
    })
  } catch (error: any) {
    console.error('WhatsApp OTP verify error:', error)
    return errorResponse(error.message || 'Failed to verify OTP', 400)
  }
}
