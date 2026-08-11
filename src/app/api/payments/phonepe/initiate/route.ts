// POST /api/payments/phonepe/initiate — Initiate PhonePe payment
import { NextRequest } from 'next/server'
import { phonePeService } from '@/lib/phonepe-service'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

export async function OPTIONS() { return handleOptions() }

export async function POST(req: NextRequest) {
  try {
    if (!phonePeService.isConfigured()) {
      return errorResponse('PhonePe payment gateway is not configured', 503)
    }

    const body = await req.json()
    const { merchantOrderId, amount, redirectUrl } = body

    if (!merchantOrderId || !amount || !redirectUrl) {
      return errorResponse('merchantOrderId, amount, and redirectUrl are required', 400)
    }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0', 400)
    }

    const result = await phonePeService.initiatePayment({
      merchantOrderId,
      amount,
      redirectUrl,
    })

    if (result.success) {
      return jsonResponse({
        success: true,
        orderId: result.orderId,
        paymentUrl: result.paymentUrl,
        message: result.message,
      })
    }

    return errorResponse(result.error || 'Payment initiation failed', 400)
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to initiate payment', 500)
  }
}
