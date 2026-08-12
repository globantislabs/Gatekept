import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAdmin, jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'
import { notificationService } from '@/lib/notification-service'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/orders?user_id=xxx — List orders for a user
// GET /api/orders?admin=true — List ALL orders (admin only)
export async function GET(req: NextRequest) {
  try {
    const adminMode = req.nextUrl.searchParams.get('admin')
    
    // Admin mode: return all orders
    if (adminMode === 'true') {
      const isAdmin = await checkAdmin(req)
      if (!isAdmin) {
        return errorResponse('Unauthorized: Admin access required', 403)
      }
      
      const orders = await db.order.findMany({
        include: {
          items: true,
          tracking: { orderBy: { tracked_at: 'desc' } },
          subscription: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { created_at: 'desc' },
      })
      
      return jsonResponse({ data: orders })
    }
    
    // Regular mode: user-specific orders
    const userId = req.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return errorResponse('user_id is required (or use admin=true)', 400)
    }

    const orders = await db.order.findMany({
      where: { user_id: userId },
      include: {
        items: true,
        tracking: { orderBy: { tracked_at: 'desc' } },
        subscription: true,
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ data: orders })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch orders', 500)
  }
}

// POST /api/orders — Create a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, items, shipping_name, shipping_phone, shipping_email, shipping_address, shipping_city, shipping_state, shipping_pincode, payment_method, notes } = body

    if (!user_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'user_id and items are required' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0)
    const taxAmount = Math.round(subtotal * 0.18) // 18% GST
    const discountAmount = items.reduce((sum: number, item: any) => sum + (item.pack_discount || 0) * item.quantity, 0)
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate order number
    const orderNumber = `NJ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    const order = await db.order.create({
      data: {
        user_id,
        order_number: orderNumber,
        status: 'PLACED',
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        payment_method: payment_method || 'UPI',
        payment_status: payment_method === 'COD' ? 'COD_PENDING' : 'PENDING',
        notes,
        items: {
          create: items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_type: item.product_type || 'FIZZ',
            quantity: item.quantity || 1,
            unit_price: item.unit_price,
            total_price: item.total_price,
            pack_type: item.pack_type,
            pack_days: item.pack_days,
            pack_discount: item.pack_discount,
          })),
        },
        tracking: {
          create: {
            status: 'PLACED',
            description: 'Order has been placed successfully',
          },
        },
      },
      include: {
        items: true,
        tracking: true,
      },
    })

    // Fire order placed notification only for COD orders.
    // Online payments should only notify after payment is confirmed.
    try {
      const user = await db.userProfile.findUnique({ where: { id: user_id } })
      if (user) {
        // If user provided an email at checkout and their profile doesn't have one, save it.
        const emailToUse = shipping_email?.trim()?.toLowerCase() || user.email
        if (emailToUse && !user.email) {
          try {
            await db.userProfile.update({
              where: { id: user_id },
              data: { email: emailToUse },
            })
          } catch (emailErr: any) {
            // Email might be taken by another user — log but don't block
            console.error('Could not save email to profile:', emailErr.message)
          }
        }
      }

      if (user && payment_method === 'COD') {
        const emailToUse = shipping_email?.trim()?.toLowerCase() || user.email
        notificationService.sendOrderPlacedNotification(
          {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total_amount: order.total_amount,
            items: order.items.map(i => ({
              product_name: i.product_name,
              quantity: i.quantity,
              total_price: i.total_price,
            })),
          },
          { id: user.id, name: user.name, email: emailToUse || user.email, phone: user.phone }
        ).catch(err => console.error('Failed to send order placed notification:', err))
      }
    } catch (err) {
      console.error('Error fetching user for notification:', err)
    }

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 })
  }
}
