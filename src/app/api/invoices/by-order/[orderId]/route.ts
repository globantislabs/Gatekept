import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/by-order/[orderId]
// Returns the invoice for a given order_id (used by user-facing UI to find the invoice
// associated with their order). Returns 404 if no invoice exists yet.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params

  const invoice = await db.invoice.findUnique({
    where: { order_id: orderId },
    select: {
      id: true,
      invoice_number: true,
      status: true,
      total_amount: true,
      issued_at: true,
      order: {
        select: { id: true, order_number: true, status: true },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'No invoice found for this order' }, { status: 404 })
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
