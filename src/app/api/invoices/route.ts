import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  checkAdmin,
  jsonResponse,
  errorResponse,
  handleOptions,
  validateRequired,
} from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/invoices?status=ISSUED|PAID|CANCELLED|OVERDUE
// GET /api/invoices?order_id=xxx  (returns the invoice for a specific order)
// GET /api/invoices (admin: list all invoices)
export async function GET(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const status = req.nextUrl.searchParams.get('status')
    const orderId = req.nextUrl.searchParams.get('order_id')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (orderId) where.order_id = orderId

    const invoices = await db.invoice.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            payment_status: true,
            payment_method: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { issued_at: 'desc' },
    })

    return jsonResponse({ data: invoices, total: invoices.length })
  } catch (error: any) {
    console.error('Error listing invoices:', error)
    return errorResponse(error.message || 'Failed to fetch invoices', 500)
  }
}

// POST /api/invoices — Generate an invoice from an existing order
// Body: { order_id: string, notes?: string }
export async function POST(req: NextRequest) {
  try {
    const isAdmin = await checkAdmin(req)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const body = await req.json()
    const validationError = validateRequired(body, ['order_id'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    const { order_id, notes } = body as { order_id: string; notes?: string }

    // Fetch the order with items + user
    const order = await db.order.findUnique({
      where: { id: order_id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!order) {
      return errorResponse('Order not found', 404)
    }

    // Check if an invoice already exists for this order (the order_id is unique
    // on the Invoice table, so we can rely on that constraint too).
    const existingInvoice = await db.invoice.findUnique({
      where: { order_id: order.id },
    })
    if (existingInvoice) {
      return errorResponse(
        `Invoice already exists for this order: ${existingInvoice.invoice_number}`,
        409,
      )
    }

    // ── Generate invoice number: INV-YYYY-NNNNN (zero-padded sequence) ──
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

    // Build line items JSON: [{ name, quantity, unit_price, total_price, pack_type? }]
    const itemsJson = JSON.stringify(
      order.items.map((i) => ({
        name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        pack_type: i.pack_type ?? null,
      })),
    )

    // Resolve customer info — prefer billing_* fields (primary contact), fall
    // back to user profile fields.
    const customerName =
      order.billing_name || order.user?.name || order.shipping_name || 'Customer'
    const customerPhone = order.billing_phone || order.user?.phone || order.shipping_phone || null
    const customerEmail = order.billing_email || order.user?.email || order.shipping_email || null
    const billingAddress = order.billing_address || order.shipping_address || null
    const billingCity = order.billing_city || order.shipping_city || null
    const billingState = order.billing_state || order.shipping_state || null
    const billingPincode = order.billing_pincode || order.shipping_pincode || null

    // Create the Invoice record (this also implicitly links to the order via
    // the order_id unique foreign key).
    const invoice = await db.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: invoiceNumber,
        user_id: order.user_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_state: billingState,
        billing_pincode: billingPincode,
        items: itemsJson,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        payment_method: order.payment_method || null,
        payment_status: order.payment_status || 'PENDING',
        status: 'ISSUED',
        notes: notes || null,
        issued_at: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            payment_status: true,
            payment_method: true,
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    // Update the Order — set invoice_number + invoice_generated_at
    await db.order.update({
      where: { id: order.id },
      data: {
        invoice_number: invoiceNumber,
        invoice_generated_at: new Date(),
      },
    })

    return jsonResponse({ data: invoice }, 201)
  } catch (error: any) {
    console.error('Error generating invoice:', error)
    return errorResponse(error.message || 'Failed to generate invoice', 500)
  }
}
