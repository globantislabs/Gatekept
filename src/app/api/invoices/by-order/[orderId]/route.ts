import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/by-order/[orderId]
// Returns the invoice for a given order_id.
// If no invoice exists yet, AUTO-GENERATES one (no separate "generate" button needed).
// This is called by the user-facing "Download Invoice" button.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  // Try to find existing invoice
  let invoice = await db.invoice.findUnique({
    where: { order_id: orderId },
    select: {
      id: true,
      invoice_number: true,
      status: true,
      total_amount: true,
      issued_at: true,
      order: { select: { id: true, order_number: true, status: true } },
    },
  })

  // Auto-generate if not found
  if (!invoice) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const year = new Date().getFullYear()
    const prefix = `INV-${year}-`
    const lastInvoice = await db.invoice.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' },
      select: { invoice_number: true },
    })
    let nextSeq = 1
    if (lastInvoice) {
      const parsed = parseInt(lastInvoice.invoice_number.slice(prefix.length), 10)
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

    const customerName = order.billing_name || order.user_id || 'Customer'

    const created = await db.invoice.create({
      data: {
        order_id: order.id,
        invoice_number: invoiceNumber,
        user_id: order.user_id,
        customer_name: customerName,
        customer_phone: order.billing_phone || null,
        customer_email: order.billing_email || null,
        billing_address: order.billing_address || null,
        billing_city: order.billing_city || null,
        billing_state: order.billing_state || null,
        billing_pincode: order.billing_pincode || null,
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
      select: {
        id: true,
        invoice_number: true,
        status: true,
        total_amount: true,
        issued_at: true,
        order: { select: { id: true, order_number: true, status: true } },
      },
    })

    await db.order.update({
      where: { id: order.id },
      data: { invoice_number: invoiceNumber, invoice_generated_at: new Date() },
    })

    invoice = created
    console.log(`[Invoices] Auto-generated ${invoiceNumber} for order ${order.order_number}`)
  }

  return NextResponse.json({
    data: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      total_amount: invoice.total_amount,
      issued_at: invoice.issued_at,
      order: invoice.order,
      download_url: `/api/invoices/download/${invoice.id}`,
    },
  })
}
