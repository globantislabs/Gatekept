import { NextRequest, NextResponse } from 'next/server'
import { smsAlertService } from '@/lib/smsalert-service'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// Handle CORS preflight
export async function OPTIONS() { return handleOptions() }

// POST /api/otp/verify — Verify OTP code entered by the user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { otp_id, otp_code } = body

    if (!otp_id || !otp_code) {
      return errorResponse('otp_id and otp_code are required', 400)
    }

    if (otp_code.length < 4 || otp_code.length > 8) {
      return errorResponse('OTP code must be between 4 and 8 digits', 400)
    }

    const result = await smsAlertService.verifyOtp(otp_id, otp_code)

    if (!result.success) {
      return jsonResponse({ success: false, message: result.message }, 400)
    }

    // OTP verified — return purpose and reference so frontend can proceed
    return jsonResponse({
      success: true,
      message: result.message,
      purpose: result.verifiedPurpose,
      reference_id: result.referenceId,
    })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to verify OTP', 500)
  }
}
