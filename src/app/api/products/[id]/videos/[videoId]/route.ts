import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// PUT /api/products/[id]/video/[videoId] - Update video (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id, videoId } = await params
    const body = await request.json()

    // Verify video exists and belongs to product
    const existing = await db.productVideo.findFirst({
      where: { id: videoId, product_id: id },
    })
    if (!existing) {
      return errorResponse('Video not found', 404)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['title', 'duration', 'description', 'video_url', 'thumbnail_url'])

    const allowedFields = [
      'title', 'duration', 'description', 'order', 'video_url', 'thumbnail_url', 'active',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (sanitized[field] !== undefined) {
        updateData[field] = sanitized[field]
      }
    }

    // Parse order to int if needed
    if (updateData.order !== undefined) {
      updateData.order = parseInt(String(updateData.order))
    }

    const video = await db.productVideo.update({
      where: { id: videoId },
      data: updateData,
    })

    return jsonResponse({ video })
  } catch (error) {
    console.error('Error updating video:', error)
    return errorResponse('Failed to update video', 500)
  }
}

// DELETE /api/products/[id]/videos/[videoId] - Delete video (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id, videoId } = await params

    // Verify video exists and belongs to product
    const existing = await db.productVideo.findFirst({
      where: { id: videoId, product_id: id },
    })
    if (!existing) {
      return errorResponse('Video not found', 404)
    }

    await db.productVideo.delete({ where: { id: videoId } })

    return jsonResponse({ message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Error deleting video:', error)
    return errorResponse('Failed to delete video', 500)
  }
}
