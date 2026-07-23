import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/subscriptions?user_id=xxx — List subscriptions for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const subscriptions = await db.subscription.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ data: subscriptions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

// POST /api/subscriptions — Create a subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, order_id, product_id, product_name, product_type, pack_type, pack_days, pack_discount, quantity, unit_price, frequency_days, next_delivery } = body

    if (!user_id || !order_id || !product_id || !pack_type) {
      return NextResponse.json({ error: 'user_id, order_id, product_id, pack_type are required' }, { status: 400 })
    }

    const subscription = await db.subscription.create({
      data: {
        user_id,
        order_id,
        product_id,
        product_name,
        product_type: product_type || 'FIZZ',
        pack_type,
        pack_days,
        pack_discount: pack_discount || 0,
        quantity: quantity || 1,
        unit_price,
        frequency_days: frequency_days || pack_days || 30,
        status: 'ACTIVE',
        next_delivery,
        total_cycles: 0,
        completed_cycles: 0,
      },
    })

    return NextResponse.json({ data: subscription }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 })
  }
}
