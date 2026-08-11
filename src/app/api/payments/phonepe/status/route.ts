// GET /api/payments/phonepe/status — Check PhonePe payment status
import { NextRequest } from 'next/server'
import { phonePeService } from '@/lib/phonepe-service'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

export async function OPTIONS() { return handleOptions() }

export async function GET(req: NextRequest) {
  try {
    if (!phonePeService.isConfigured()) {
      return errorResponse('PhonePe payment gateway is not configured', 503)
    }

    const merchantOrderId = req.nextUrl.searchParams.get('merchantOrderId')
    if (!merchantOrderId) {
      return errorResponse('merchantOrderId is required', 400)
    }

    const result = await phonePeService.checkStatus(merchantOrderId)

    return jsonResponse({
      success: result.success,
      status: result.status,
      paymentDetails: result.paymentDetails,
      message: result.message,
    })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to check payment status', 500)
  }
}
