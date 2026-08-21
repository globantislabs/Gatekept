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
          invoice: true,
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
        invoice: true,
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
    const {
      user_id, items,
      // Billing address (primary contact for WhatsApp / email notifications)
      billing_name, billing_phone, billing_email, billing_address,
      billing_city, billing_state, billing_pincode,
      // Shipping address (may be identical to billing when same_as_billing=true)
      shipping_name, shipping_phone, shipping_email, shipping_address,
      shipping_city, shipping_state, shipping_pincode,
      same_as_billing,
      payment_method, notes,
    } = body

    if (!user_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'user_id and items are required' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total_price, 0)
    const taxAmount = Math.round(subtotal * 0.18) // 18% GST
    // pack_discount is a PERCENTAGE — convert to absolute amount per item
    const discountAmount = items.reduce((sum: number, item: any) => {
      const pct = (item.pack_discount || 0)
      return sum + ((pct / 100) * item.unit_price * (item.quantity || 1))
    }, 0)
    const totalAmount = subtotal + taxAmount - discountAmount

    // Generate order number
    const orderNumber = `NJ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // ── Resolve shipping fields when "same as billing" is checked ──
    const isSameAsBilling = same_as_billing !== false
    const finalShippingName = isSameAsBilling ? billing_name : shipping_name
    const finalShippingPhone = isSameAsBilling ? billing_phone : shipping_phone
    const finalShippingEmail = isSameAsBilling ? billing_email : shipping_email
    const finalShippingAddress = isSameAsBilling ? billing_address : shipping_address
    const finalShippingCity = isSameAsBilling ? billing_city : shipping_city
    const finalShippingState = isSameAsBilling ? billing_state : shipping_state
    const finalShippingPincode = isSameAsBilling ? billing_pincode : shipping_pincode

    const order = await db.order.create({
      data: {
        user_id,
        order_number: orderNumber,
        status: 'PLACED',
        total_amount: totalAmount,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        // ── Billing address ──
        billing_name,
        billing_phone,
        billing_email,
        billing_address,
        billing_city,
        billing_state,
        billing_pincode,
        // ── Shipping address (auto-copied from billing when same_as_billing) ──
        shipping_name: finalShippingName,
        shipping_phone: finalShippingPhone,
        shipping_email: finalShippingEmail,
        shipping_address: finalShippingAddress,
        shipping_city: finalShippingCity,
        shipping_state: finalShippingState,
        shipping_pincode: finalShippingPincode,
        same_as_billing: isSameAsBilling,
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
        invoice: true,
      },
    })

    // ── Auto-generate invoice for this order ──
    try {
      const year = new Date().getFullYear()
      const prefix = `INV-${year}-`
      const lastInvoice = await db.invoice.findFirst({
        where: { invoice_number: { startsWith: prefix } },
        orderBy: { invoice_number: 'desc' },
        select: { invoice_number: true },
      })
      let nextSeq = 1
      if (lastInvoice) {
        const seqPart = lastInvoice.invoice_number.slice(prefix.length)
        const parsed = parseInt(seqPart, 10)
        if (!Number.isNaN(parsed)) nextSeq = parsed + 1
      }
      const invoiceNumber = `${prefix}${String(nextSeq).padStart(5, '0')}`

      const itemsJson = JSON.stringify(
        order.items.map(i => ({
          name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          pack_type: i.pack_type ?? null,
        }))
      )

      const customerName = billing_name || order.user_id || 'Customer'
      await db.invoice.create({
        data: {
          order_id: order.id,
          invoice_number: invoiceNumber,
          user_id: order.user_id,
          customer_name: customerName,
          customer_phone: billing_phone || null,
          customer_email: billing_email || null,
          billing_address: billing_address || null,
          billing_city: billing_city || null,
          billing_state: billing_state || null,
          billing_pincode: billing_pincode || null,
          items: itemsJson,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          discount_amount: order.discount_amount,
          total_amount: order.total_amount,
          payment_method: order.payment_method || null,
          payment_status: order.payment_status || 'PENDING',
          status: 'ISSUED',
          issued_at: new Date(),
        },
      })
      await db.order.update({
        where: { id: order.id },
        data: { invoice_number: invoiceNumber, invoice_generated_at: new Date() },
      })
      console.log(`[Orders] Auto-generated invoice ${invoiceNumber} for order ${order.order_number}`)
    } catch (invErr: any) {
      console.error('[Orders] Failed to auto-generate invoice:', invErr.message)
      // Don't block order creation if invoice generation fails
    }

    // Fire order placed notification asynchronously (don't block the response)
    try {
      const user = await db.userProfile.findUnique({ where: { id: user_id } })
      if (user) {
        // ── Billing email/phone are the PRIMARY contact ──
        // Use billing_email first, fall back to user.email if missing
        const emailToUse = billing_email?.trim()?.toLowerCase() || user.email
        // Use billing_phone first, fall back to user.phone if missing
        const phoneToUse = billing_phone?.trim() || user.phone

        // If user provided an email at checkout and their profile doesn't have one, save it
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

        // If user provided a phone at checkout and their profile doesn't have one, save it
        if (phoneToUse && !user.phone) {
          try {
            await db.userProfile.update({
              where: { id: user_id },
              data: { phone: phoneToUse },
            })
          } catch (phoneErr: any) {
            console.error('Could not save phone to profile:', phoneErr.message)
          }
        }

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
          { id: user.id, name: user.name, email: emailToUse || user.email, phone: phoneToUse }
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
