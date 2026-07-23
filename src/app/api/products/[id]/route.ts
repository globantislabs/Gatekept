import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateNumeric, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/products/[id] - Get single product with its videos and quizzes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { order: 'asc' },
        },
        quizzes: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!product) {
      return errorResponse('Product not found', 404)
    }

    // Parse quiz options from JSON strings
    const parsedQuizzes = product.quizzes.map((quiz) => ({
      ...quiz,
      options: JSON.parse(quiz.options),
    }))

    return jsonResponse({
      product: {
        ...product,
        quizzes: parsedQuizzes,
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return errorResponse('Failed to fetch product', 500)
  }
}

// PUT /api/products/[id] - Update product (admin only)
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

    // Check if product exists
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Product not found', 404)
    }

    // Validate numeric fields if provided
    const numericError = validateNumeric(body, {
      price: { min: 0 },
      mrp: { min: 0 },
      stock: { min: 0, integer: true },
      gst_rate: { min: 0, max: 100 },
      min_order_qty: { min: 1, integer: true },
      max_order_qty: { min: 1, integer: true },
    })
    if (numericError) {
      return errorResponse(numericError, 400)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'slug', 'description', 'short_description', 'sku', 'type', 'category', 'brand', 'flavor'])

    // If slug is being updated, check uniqueness
    if (sanitized.slug && sanitized.slug !== existing.slug) {
      const slugExists = await db.product.findUnique({ where: { slug: sanitized.slug as string } })
      if (slugExists) {
        return errorResponse('Product with this slug already exists', 400)
      }
    }

    // Build update data from provided fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'slug', 'description', 'short_description', 'price', 'mrp',
      'stock', 'image_url', 'gallery_images', 'type', 'category', 'sku',
      'weight', 'ingredients', 'nutrition_info', 'tags', 'active', 'featured',
      'brand', 'flavor', 'serving_size', 'allergen_info', 'storage_info',
      'shelf_life', 'country_origin', 'fssai_license', 'hsn_code', 'gst_rate',
      'min_order_qty', 'max_order_qty', 'discount_label', 'highlights',
    ]

    for (const field of allowedFields) {
      if (sanitized[field] !== undefined) {
        updateData[field] = sanitized[field]
      }
    }

    // Parse numeric fields
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(String(updateData.price))
    }
    if (updateData.mrp !== undefined) {
      updateData.mrp = updateData.mrp ? parseFloat(String(updateData.mrp)) : null
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return jsonResponse({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return errorResponse('Failed to update product', 500)
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
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

    // Check if product exists
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('Product not found', 404)
    }

    await db.product.delete({ where: { id } })

    return jsonResponse({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return errorResponse('Failed to delete product', 500)
  }
}
