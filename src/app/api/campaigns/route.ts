import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }
    if (channel) {
      where.channel = channel
    }

    const campaigns = await db.campaign.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        product: true,
        _count: {
          select: { qrScans: true },
        },
      },
    })

    return jsonResponse({ campaigns, total: campaigns.length })
  } catch (error) {
    console.error('Error listing campaigns:', error)
    return errorResponse('Failed to fetch campaigns', 500)
  }
}

// POST /api/campaigns - Create campaign (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const body = await request.json()

    // Validate required fields
    const validationError = validateRequired(body, ['name'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'channel', 'partner_name', 'location', 'status'])

    const {
      name,
      channel,
      partner_name,
      location,
      product_id,
      start_date,
      end_date,
      status,
      qr_code_url,
    } = sanitized

    const campaign = await db.campaign.create({
      data: {
        name: name as string,
        channel: channel as string || 'HOTEL',
        partner_name: partner_name as string || null,
        location: location as string || null,
        product_id: product_id ? (product_id as string) : null,
        start_date: start_date ? new Date(start_date as string) : null,
        end_date: end_date ? new Date(end_date as string) : null,
        status: status as string || 'ACTIVE',
        qr_code_url: qr_code_url as string || null,
      },
      include: { product: true },
    })

    return jsonResponse({ campaign }, 201)
  } catch (error) {
    console.error('Error creating campaign:', error)
    return errorResponse('Failed to create campaign', 500)
  }
}
