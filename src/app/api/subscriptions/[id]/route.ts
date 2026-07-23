import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/subscriptions/[id] — Get single subscription
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const subscription = await db.subscription.findUnique({
      where: { id },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json({ data: subscription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription' }, { status: 500 })
  }
}

// PATCH /api/subscriptions/[id] — Update subscription (OTP-gated for cancel/pause/resume)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, otp_verified_id, ...restData } = body

    // OTP required for cancel, pause, resume
    if (['cancel', 'pause', 'resume'].includes(action)) {
      if (!otp_verified_id) {
        return NextResponse.json(
          { error: `OTP verification required for ${action} action. Send otp_verified_id from a verified OTP record.` },
          { status: 403 }
        )
      }
      const otpRecord = await db.otpVerification.findUnique({
        where: { id: otp_verified_id },
      })
      const expectedPurpose = action === 'cancel' ? 'CANCEL_SUB' : action === 'pause' ? 'PAUSE_SUB' : 'RESUME_SUB'
      if (
        !otpRecord ||
        otpRecord.status !== 'VERIFIED' ||
        otpRecord.purpose !== expectedPurpose ||
        otpRecord.reference_id !== id
      ) {
        return NextResponse.json(
          { error: `Invalid or unverified OTP for ${action} subscription` },
          { status: 403 }
        )
      }
      // Clean up — mark OTP as consumed
      await db.otpVerification.update({
        where: { id: otp_verified_id },
        data: { status: 'EXPIRED' },
      })
    }

    const existing = await db.subscription.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let updateData: any = { ...restData }

    if (action === 'pause') {
      updateData = {
        status: 'PAUSED',
        paused_at: new Date(),
      }
    } else if (action === 'resume') {
      updateData = {
        status: 'ACTIVE',
        paused_at: null,
        next_delivery: new Date(Date.now() + existing.frequency_days * 24 * 60 * 60 * 1000),
      }
    } else if (action === 'cancel') {
      updateData = {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        end_date: new Date(),
      }
    }

    const subscription = await db.subscription.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: subscription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update subscription' }, { status: 500 })
  }
}
