import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/[id]/tracking — Get tracking history for an order
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tracking = await db.orderTracking.findMany({
      where: { order_id: id },
      orderBy: { tracked_at: 'desc' },
    })

    return NextResponse.json({ data: tracking })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tracking' }, { status: 500 })
  }
}

// POST /api/orders/[id]/tracking — Add tracking event
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, location, description } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    // Create tracking event and update order status
    const tracking = await db.orderTracking.create({
      data: {
        order_id: id,
        status,
        location,
        description,
      },
    })

    // Update order status to match
    await db.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ data: tracking }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add tracking' }, { status: 500 })
  }
}
