import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdmin, jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'
import { notificationService } from '@/lib/notification-service'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/orders/[id] — Get single order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        tracking: { orderBy: { tracked_at: 'desc' } },
        subscription: true,
        invoice: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!order) {
      return errorResponse('Order not found', 404)
    }

    return jsonResponse({ data: order })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch order', 500)
  }
}

// PATCH /api/orders/[id] — Update order (OTP-gated for cancellation, or admin status update)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, otp_verified_id, ...restData } = body

    // Check if this is an admin request
    const isAdmin = await checkAdmin(req)

    // For cancellation, require OTP verification (unless admin)
    if (status === 'CANCELLED' && !isAdmin) {
      if (!otp_verified_id) {
        return errorResponse('OTP verification required to cancel an order. Send otp_verified_id from a verified OTP record.', 403)
      }
      // Verify that the OTP was actually verified for this specific order
      const otpRecord = await db.otpVerification.findUnique({
        where: { id: otp_verified_id },
      })
      if (
        !otpRecord ||
        otpRecord.status !== 'VERIFIED' ||
        otpRecord.purpose !== 'CANCEL_ORDER' ||
        otpRecord.reference_id !== id
      ) {
        return errorResponse('Invalid or unverified OTP for cancelling this order', 403)
      }
      // Clean up — mark OTP record as consumed (one-time use)
      await db.otpVerification.update({
        where: { id: otp_verified_id },
        data: { status: 'EXPIRED' }, // Re-purpose expired to mean "consumed"
      })
    }

    const updateData: any = { ...restData }
    if (status) updateData.status = status

    // Add tracking event for status changes
    if (status) {
      await db.orderTracking.create({
        data: {
          order_id: id,
          status,
          description: isAdmin ? `Order status updated to ${status} by admin` : `Order status updated to ${status}`,
        },
      })
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        tracking: { orderBy: { tracked_at: 'desc' } },
        invoice: true,
      },
    })

    // Fire notification based on new status (async, don't block response)
    try {
      const orderWithUser = await db.order.findUnique({
        where: { id },
        include: { user: true, items: true },
      })
      if (orderWithUser?.user) {
        const orderInfo = {
          id: orderWithUser.id,
          order_number: orderWithUser.order_number,
          status: orderWithUser.status,
          total_amount: orderWithUser.total_amount,
          items: orderWithUser.items.map(i => ({
            product_name: i.product_name,
            quantity: i.quantity,
            total_price: i.total_price,
          })),
        }
        const userInfo = {
          id: orderWithUser.user.id,
          name: orderWithUser.user.name,
          email: orderWithUser.user.email,
          phone: orderWithUser.user.phone,
        }

        // Send notification based on status
        const newStatus = status || body.status
        if (newStatus === 'CONFIRMED') {
          notificationService.sendOrderConfirmedNotification(orderInfo, userInfo).catch(err => console.error('Failed to send order confirmed notification:', err))
        } else if (newStatus === 'SHIPPED') {
          notificationService.sendOrderShippedNotification(orderInfo, userInfo).catch(err => console.error('Failed to send order shipped notification:', err))
        } else if (newStatus === 'DELIVERED') {
          notificationService.sendOrderDeliveredNotification(orderInfo, userInfo).catch(err => console.error('Failed to send order delivered notification:', err))
        } else if (newStatus === 'CANCELLED') {
          notificationService.sendOrderCancelledNotification(orderInfo, userInfo).catch(err => console.error('Failed to send order cancelled notification:', err))
        }

        // Also send payment notification if payment_status changed to COMPLETED
        const newPaymentStatus = body.payment_status
        if (newPaymentStatus === 'COMPLETED' && orderWithUser.payment_status !== 'COMPLETED') {
          notificationService.sendPaymentReceivedNotification(orderInfo, userInfo).catch(err => console.error('Failed to send payment received notification:', err))
        }
      }
    } catch (err) {
      console.error('Error sending order notification:', err)
    }

    return jsonResponse({ data: order })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update order', 500)
  }
}
