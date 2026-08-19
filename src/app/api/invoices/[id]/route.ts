import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  checkAdmin,
  jsonResponse,
  errorResponse,
  handleOptions,
} from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/invoices/[id] — Fetch a single invoice by id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin(req)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            payment_status: true,
            payment_method: true,
            tracking: { orderBy: { tracked_at: 'desc' } },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!invoice) {
      return errorResponse('Invoice not found', 404)
    }

    return jsonResponse({ data: invoice })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return errorResponse(error.message || 'Failed to fetch invoice', 500)
  }
}

// PATCH /api/invoices/[id] — Update invoice status / notes
// Body: { status?: 'ISSUED'|'PAID'|'CANCELLED'|'OVERDUE', notes?: string, payment_status?: string }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await checkAdmin(req)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.payment_status) updateData.payment_status = body.payment_status
    if (body.payment_method !== undefined) {
      updateData.payment_method = body.payment_method || null
    }

    // Verify the invoice exists
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Invoice not found', 404)
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
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

    return jsonResponse({ data: invoice })
  } catch (error: any) {
    console.error('Error updating invoice:', error)
    return errorResponse(error.message || 'Failed to update invoice', 500)
  }
}
