import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/orders/[id]/address — Modify shipping address (OTP-gated)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      otp_verified_id,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
    } = body

    // Verify OTP
    if (!otp_verified_id) {
      return NextResponse.json(
        { error: 'OTP verification required to modify shipping address' },
        { status: 403 }
      )
    }
    const otpRecord = await db.otpVerification.findUnique({
      where: { id: otp_verified_id },
    })
    if (
      !otpRecord ||
      otpRecord.status !== 'VERIFIED' ||
      otpRecord.purpose !== 'MODIFY_ADDRESS' ||
      otpRecord.reference_id !== id
    ) {
      return NextResponse.json(
        { error: 'Invalid or unverified OTP for address modification' },
        { status: 403 }
      )
    }

    // Clean up — mark OTP as consumed
    await db.otpVerification.update({
      where: { id: otp_verified_id },
      data: { status: 'EXPIRED' },
    })

    // Only allow address modification for PLACED/CONFIRMED orders (before shipping)
    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Address can only be modified before the order is shipped' },
        { status: 400 }
      )
    }

    const updated = await db.order.update({
      where: { id },
      data: {
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
      },
      include: {
        items: true,
        tracking: { orderBy: { tracked_at: 'desc' } },
        subscription: true,
      },
    })

    // Add tracking event for address change
    await db.orderTracking.create({
      data: {
        order_id: id,
        status: order.status,
        description: 'Shipping address updated by customer',
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update address' }, { status: 500 })
  }
}
