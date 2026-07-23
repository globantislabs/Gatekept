import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 })
  }
}

// PATCH /api/orders/[id] — Update order (OTP-gated for cancellation)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, otp_verified_id, ...restData } = body

    // For cancellation, require OTP verification
    if (status === 'CANCELLED') {
      if (!otp_verified_id) {
        return NextResponse.json(
          { error: 'OTP verification required to cancel an order. Send otp_verified_id from a verified OTP record.' },
          { status: 403 }
        )
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
        return NextResponse.json(
          { error: 'Invalid or unverified OTP for cancelling this order' },
          { status: 403 }
        )
      }
      // Clean up — mark OTP record as consumed (one-time use)
      await db.otpVerification.update({
        where: { id: otp_verified_id },
        data: { status: 'EXPIRED' }, // Re-purpose expired to mean "consumed"
      })
    }

    const updateData: any = { ...restData }
    if (status) updateData.status = status

    // Add tracking event for cancellation
    if (status === 'CANCELLED') {
      await db.orderTracking.create({
        data: {
          order_id: id,
          status: 'CANCELLED',
          description: 'Order cancelled by customer (OTP verified)',
        },
      })
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        tracking: { orderBy: { tracked_at: 'desc' } },
      },
    })

    return NextResponse.json({ data: order })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
  }
}
