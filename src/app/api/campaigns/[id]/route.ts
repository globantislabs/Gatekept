import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/campaigns/[id] - Fetch a single campaign (with linked product)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        product: true,
        _count: { select: { qrScans: true } },
      },
    })
    if (!campaign) {
      return errorResponse('Campaign not found', 404)
    }
    return jsonResponse({ campaign })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return errorResponse('Failed to fetch campaign', 500)
  }
}

// PUT /api/campaigns/[id] - Update campaign (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id } = await params
    const body = await request.json()

    // Verify campaign exists
    const existing = await db.campaign.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Campaign not found', 404)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'channel', 'partner_name', 'location', 'status'])

    const allowedFields = [
      'name', 'channel', 'partner_name', 'location',
      'product_id', 'start_date', 'end_date', 'status', 'qr_code_url',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (sanitized[field] !== undefined) {
        updateData[field] = sanitized[field]
      }
    }

    // Treat empty string product_id as null (unlink)
    if (updateData.product_id !== undefined) {
      const pid = updateData.product_id
      if (pid === '' || pid === null) {
        updateData.product_id = null
      }
    }

    // Parse date fields
    if (updateData.start_date !== undefined) {
      updateData.start_date = updateData.start_date ? new Date(updateData.start_date as string) : null
    }
    if (updateData.end_date !== undefined) {
      updateData.end_date = updateData.end_date ? new Date(updateData.end_date as string) : null
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
      include: { product: true },
    })

    return jsonResponse({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return errorResponse('Failed to update campaign', 500)
  }
}

// DELETE /api/campaigns/[id] - Delete campaign (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id } = await params

    // Verify campaign exists
    const existing = await db.campaign.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Campaign not found', 404)
    }

    await db.campaign.delete({ where: { id } })

    return jsonResponse({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return errorResponse('Failed to delete campaign', 500)
  }
}
