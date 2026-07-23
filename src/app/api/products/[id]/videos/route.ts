import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/products/[id]/videos - List videos for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return errorResponse('Product not found', 404)
    }

    const videos = await db.productVideo.findMany({
      where: { product_id: id },
      orderBy: { order: 'asc' },
    })

    return jsonResponse({ videos, total: videos.length })
  } catch (error) {
    console.error('Error listing videos:', error)
    return errorResponse('Failed to fetch videos', 500)
  }
}

// POST /api/products/[id]/videos - Create video for product (admin only)
export async function POST(
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

    // Validate required fields
    const validationError = validateRequired(body, ['title'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['title', 'description', 'duration', 'video_url', 'thumbnail_url'])

    // Verify product exists
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return errorResponse('Product not found', 404)
    }

    const {
      title,
      duration,
      description,
      order,
      video_url,
      thumbnail_url,
      active,
    } = sanitized

    const video = await db.productVideo.create({
      data: {
        product_id: id,
        title: title as string,
        duration: duration as string || '5:00',
        description: description as string || null,
        order: order ? parseInt(String(order)) : 0,
        video_url: video_url as string || null,
        thumbnail_url: thumbnail_url as string || null,
        active: active === true ?? true,
      },
    })

    return jsonResponse({ video }, 201)
  } catch (error) {
    console.error('Error creating video:', error)
    return errorResponse('Failed to create video', 500)
  }
}
