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

    // ── Dedupe bursts: one physical scan must record ONE row ──
    // QR scanner apps and in-app browsers (WhatsApp/Instagram) often prefetch
    // or reload the landing URL several times per scan; each load re-posts
    // here. If an identical scan (same campaign + device signature) was
    // recorded within the last 60 seconds, return that record instead of
    // creating a duplicate.
    const recent = await db.qrScan.findFirst({
      where: {
        campaign_id: body.campaign_id || null,
        device: body.device || null,
        created_at: { gte: new Date(Date.now() - 60_000) },
      },
      orderBy: { created_at: 'desc' },
    })
    if (recent) {
      return jsonResponse({ scan: recent, deduped: true })
    }

    const scan = await db.qrScan.create({
      data: {
        campaign_id: body.campaign_id || null,
        product_id: body.product_id || null,
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
        campaign: { select: { id: true, name: true, channel: true, product_id: true } },
        user: { select: { id: true, name: true, user_id: true } },
      },
    })

    return jsonResponse({ scans, total: scans.length })
  } catch (error) {
    console.error('Error listing scans:', error)
    return errorResponse('Failed to fetch scans', 500)
  }
}
