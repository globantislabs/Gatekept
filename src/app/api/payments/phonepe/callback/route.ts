// POST /api/payments/phonepe/callback — PhonePe payment callback/redirect handler
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { phonePeService } from '@/lib/phonepe-service'
import { notificationService } from '@/lib/notification-service'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

export async function OPTIONS() { return handleOptions() }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { merchantOrderId, status } = body

    if (!merchantOrderId) {
      return errorResponse('merchantOrderId is required', 400)
    }

    // Verify with PhonePe
    if (phonePeService.isConfigured()) {
      const verification = await phonePeService.checkStatus(merchantOrderId)

      if (verification.success && verification.status === 'COMPLETED') {
        // Update order payment status
        const order = await db.order.findFirst({
          where: { order_number: merchantOrderId },
          include: { items: true },
        })

        if (order) {
          const updated = await db.order.update({
            where: { id: order.id },
            data: {
              payment_status: 'COMPLETED',
              payment_method: 'PHONEPE',
              payment_ref: verification.paymentDetails
                ? `PHONEPE_${merchantOrderId}`
                : null,
            },
          })

          // Send payment confirmation notifications
          const user = await db.userProfile.findUnique({ where: { id: order.user_id } })
          if (user) {
            notificationService.sendPaymentReceivedNotification(
              { id: updated.id, order_number: updated.order_number, status: updated.status, total_amount: updated.total_amount, items: updated.items || undefined },
              { id: user.id, name: user.name, email: user.email, phone: user.phone }
            ).catch(err => console.error('Failed to send payment notification:', err))
          }
        }

        return jsonResponse({ success: true, status: 'COMPLETED', message: 'Payment confirmed and order updated' })
      }

      return jsonResponse({ success: false, status: verification.status, message: 'Payment not completed' })
    }

    return errorResponse('PhonePe not configured', 503)
  } catch (error: any) {
    return errorResponse(error.message || 'Callback processing failed', 500)
  }
}
