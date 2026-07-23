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

// PATCH /api/subscriptions/[id] — Update subscription (pause, cancel, resume)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body

    const existing = await db.subscription.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    let updateData: any = {}

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
    } else {
      // Generic update
      updateData = body
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
