import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

export async function OPTIONS() {
  return handleOptions()
}

// POST /api/scans - Create a QR scan record (called when someone scans a QR code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const scan = await db.qrScan.create({
      data: {
        campaign_id: body.campaign_id || null,
        user_id: body.user_id || null,
        device: body.device || null,
        location: body.location || null,
      },
    })

    return jsonResponse({ scan }, 201)
  } catch (error) {
    console.error('Error creating scan:', error)
    return errorResponse('Failed to create scan', 500)
  }
}

// GET /api/scans - List all scans (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')

    const where: Record<string, unknown> = {}
    if (campaignId) where.campaign_id = campaignId

    const scans = await db.qrScan.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        campaign: { select: { id: true, name: true, channel: true } },
        user: { select: { id: true, name: true, user_id: true } },
      },
    })

    return jsonResponse({ scans, total: scans.length })
  } catch (error) {
    console.error('Error listing scans:', error)
    return errorResponse('Failed to fetch scans', 500)
  }
}
