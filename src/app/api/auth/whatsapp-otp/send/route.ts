import { whatsappOtpService } from '@/lib/whatsapp-otp-service'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/whatsapp-otp/send — Send WhatsApp OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, purpose } = body

    if (!phone || typeof phone !== 'string') {
      return errorResponse('Phone number is required', 400)
    }

    const validPurpose = purpose || 'WHATSAPP_LOGIN'
    if (validPurpose !== 'WHATSAPP_LOGIN') {
      return errorResponse('Invalid purpose. Only WHATSAPP_LOGIN is supported.', 400)
    }

    const result = await whatsappOtpService.sendOtp(phone, validPurpose)

    return jsonResponse({
      success: result.success,
      otp_id: result.otp_id,
      message: result.message,
      phone_masked: result.phone_masked,
      otp_code: result.otp_code,  // Returned for frontend notification display
    })
  } catch (error: any) {
    console.error('WhatsApp OTP send error:', error)
    return errorResponse(error.message || 'Failed to send WhatsApp OTP', 400)
  }
}
