export const dynamic = 'force-dynamic'

import { db, safeDbQuery } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateNumeric, sanitizeStringFields } from '@/lib/api-utils'
import { Prisma } from '@prisma/client'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// ─── Helper: Check if error is a missing column/table error ─────
function isSchemaMismatchError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.errorCode === 'P2021' || error.errorCode === 'P2022'
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('unknown column') || msg.includes("doesn't exist")
  }
  return false
}

// ─── Helper: Select without qr_code_url for schema fallback ────
function getSafeProductSelectWithoutQrCode() {
  return {
    id: true,
    name: true,
    slug: true,
    description: true,
    short_description: true,
    price: true,
    subscription_plans: true,
    mrp: true,
    stock: true,
    image_url: true,
    gallery_images: true,
    type: true,
    category: true,
    sku: true,
    weight: true,
    ingredients: true,
    nutrition_info: true,
    tags: true,
    active: true,
    featured: true,
    serving_size: true,
    allergen_info: true,
    storage_info: true,
    shelf_life: true,
    country_origin: true,
    fssai_license: true,
    hsn_code: true,
    gst_rate: true,
    min_order_qty: true,
    max_order_qty: true,
    discount_label: true,
    highlights: true,
    requires_learning: true,
    // qr_code_url intentionally excluded — column may not exist in production DB
    created_at: true,
    updated_at: true,
    videos: {
      orderBy: { order: 'asc' as const },
    },
    quizzes: {
      orderBy: { order: 'asc' as const },
    },
  }
}

// GET /api/products/[id] - Get single product with its videos and quizzes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First attempt: try with full include (includes qr_code_url)
    const result = await safeDbQuery(
      (client) => client.product.findUnique({
        where: { id },
        include: {
          videos: {
            orderBy: { order: 'asc' },
          },
          quizzes: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      { operationName: `GET /api/products/${id} (findUnique)` }
    )

    if (result.success) {
      if (!result.data) {
        return errorResponse('Product not found', 404)
      }

      // Parse quiz options from JSON strings
      const parsedQuizzes = result.data.quizzes.map((quiz) => ({
        ...quiz,
        options: JSON.parse(quiz.options),
      }))

      return jsonResponse({
        product: {
          ...result.data,
          quizzes: parsedQuizzes,
        },
      })
    }

    // If schema mismatch (e.g., qr_code_url column missing), retry without it
    if (result.error?.type === 'schema' || isSchemaMismatchError(result.error?.originalError)) {
      console.warn(`[API /products/${id}] Schema mismatch detected, retrying without qr_code_url`)

      const fallbackResult = await safeDbQuery(
        (client) => client.product.findUnique({
          where: { id },
          select: getSafeProductSelectWithoutQrCode(),
        }),
        { operationName: `GET /api/products/${id} (findUnique fallback)` }
      )

      if (fallbackResult.success) {
        if (!fallbackResult.data) {
          return errorResponse('Product not found', 404)
        }
        const product = { ...fallbackResult.data, qr_code_url: null }
        const parsedQuizzes = product.quizzes.map((quiz) => ({
          ...quiz,
          options: JSON.parse(quiz.options),
        }))
        return jsonResponse({
          product: { ...product, quizzes: parsedQuizzes },
        })
      }

      return errorResponse(
        `Database error: ${fallbackResult.error?.type === 'connection' ? 'Unable to connect to database' : fallbackResult.error?.message || 'Unknown error'}`,
        500
      )
    }

    // Connection or other error
    const errorType = result.error?.type
    const errorMsg = result.error?.message || 'Unknown database error'
    if (errorType === 'connection') {
      return errorResponse(`Database connection error: ${errorMsg}`, 503)
    }
    return errorResponse(`Failed to fetch product: ${errorMsg}`, 500)
  } catch (error) {
    console.error(`[API /products] Unexpected error fetching product:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unexpected error fetching product: ${message}`, 500)
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
    const existingResult = await safeDbQuery(
      (client) => client.product.findUnique({ where: { id } }),
      { operationName: `PUT /api/products/${id} (findUnique)` }
    )
    if (!existingResult.success) {
      return errorResponse(
        `Database error checking product: ${existingResult.error?.message || 'Unknown error'}`,
        500
      )
    }
    if (!existingResult.data) {
      return errorResponse('Product not found', 404)
    }

    const existing = existingResult.data

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

    // Sanitize string fields — short fields at 255, long text fields at 5000
    const sanitizedShort = sanitizeStringFields(body, ['name', 'slug', 'sku', 'type', 'category'], 255)
    const sanitizedLong = sanitizeStringFields(body, ['description', 'short_description', 'ingredients', 'nutrition_info', 'allergen_info', 'storage_info', 'highlights'], 5000)
    const sanitized = { ...sanitizedShort, ...sanitizedLong }

    // If slug is being updated, check uniqueness
    if (sanitized.slug && sanitized.slug !== existing.slug) {
      const slugResult = await safeDbQuery(
        (client) => client.product.findUnique({ where: { slug: sanitized.slug as string } }),
        { operationName: `PUT /api/products/${id} (slug check)` }
      )
      if (!slugResult.success) {
        return errorResponse(
          `Database error checking slug: ${slugResult.error?.message || 'Unknown error'}`,
          500
        )
      }
      if (slugResult.data) {
        return errorResponse('Product with this slug already exists', 400)
      }
    }

    // Build update data from provided fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'slug', 'description', 'short_description', 'price', 'mrp',
      'stock', 'image_url', 'gallery_images', 'type', 'category', 'sku',
      'weight', 'ingredients', 'nutrition_info', 'tags', 'active', 'featured',
      'subscription_plans', 'serving_size', 'allergen_info', 'storage_info',
      'shelf_life', 'country_origin', 'fssai_license', 'hsn_code', 'gst_rate',
      'min_order_qty', 'max_order_qty', 'discount_label', 'highlights',
      'qr_code_url', 'requires_learning'
    ]

    for (const field of allowedFields) {
      if (sanitized[field] !== undefined) {
        updateData[field] = sanitized[field]
      }
    }

    // Force boolean fields to strict booleans — a TINYINT (0/1), string ('true'/'false')
    // or number coming from the client must never be stored as-is, otherwise the
    // Admin Panel "Requires Learning" toggle appears to never change its state.
    if (sanitized.requires_learning !== undefined) {
      updateData.requires_learning =
        sanitized.requires_learning === true ||
        sanitized.requires_learning === 'true' ||
        sanitized.requires_learning === 1
    }
    if (sanitized.active !== undefined) {
      updateData.active =
        sanitized.active === true || sanitized.active === 'true' || sanitized.active === 1
    }
    if (sanitized.featured !== undefined) {
      updateData.featured =
        sanitized.featured === true || sanitized.featured === 'true' || sanitized.featured === 1
    }

    // Parse numeric fields
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(String(updateData.price))
    }
    if (updateData.mrp !== undefined) {
      updateData.mrp = updateData.mrp ? parseFloat(String(updateData.mrp)) : null
    }

    const updateResult = await safeDbQuery(
      (client) => client.product.update({
        where: { id },
        data: updateData,
      }),
      { operationName: `PUT /api/products/${id} (update)` }
    )

    if (!updateResult.success) {
      // If qr_code_url column doesn't exist, retry without it
      if (updateResult.error?.type === 'schema' || isSchemaMismatchError(updateResult.error?.originalError)) {
        console.warn(`[API /products/${id}] qr_code_url column missing, updating without it`)
        const { qr_code_url: _qrc, ...dataWithoutQr } = updateData
        const fallbackResult = await safeDbQuery(
          (client) => client.product.update({
            where: { id },
            data: dataWithoutQr,
          }),
          { operationName: `PUT /api/products/${id} (update without qr_code_url)` }
        )
        if (fallbackResult.success) {
          return jsonResponse({ product: { ...fallbackResult.data, qr_code_url: null } })
        }
        return errorResponse(
          `Failed to update product: ${fallbackResult.error?.message || 'Unknown error'}`,
          500
        )
      }
      return errorResponse(
        `Failed to update product: ${updateResult.error?.message || 'Unknown error'}`,
        500
      )
    }

    return jsonResponse({ product: updateResult.data })
  } catch (error) {
    console.error(`[API /products] Unexpected error updating product:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unexpected error updating product: ${message}`, 500)
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
    const existingResult = await safeDbQuery(
      (client) => client.product.findUnique({ where: { id } }),
      { operationName: `DELETE /api/products/${id} (findUnique)` }
    )
    if (!existingResult.success) {
      return errorResponse(
        `Database error checking product: ${existingResult.error?.message || 'Unknown error'}`,
        500
      )
    }
    if (!existingResult.data) {
      return errorResponse('Product not found', 404)
    }

    // Check if product has linked orders (foreign key constraint)
    const orderItemsResult = await safeDbQuery(
      (client) => client.orderItem.findFirst({ where: { product_id: id } }),
      { operationName: `DELETE /api/products/${id} (check orderItems)` }
    )
    if (orderItemsResult.success && orderItemsResult.data) {
      return errorResponse(
        'Cannot delete product: it has linked orders. Deactivate it instead (set Active = false).',
        409
      )
    }

    // Check linked subscriptions
    const subscriptionResult = await safeDbQuery(
      (client) => client.subscription.findFirst({ where: { product_id: id } }),
      { operationName: `DELETE /api/products/${id} (check subscriptions)` }
    )
    if (subscriptionResult.success && subscriptionResult.data) {
      return errorResponse(
        'Cannot delete product: it has linked subscriptions. Deactivate it instead (set Active = false).',
        409
      )
    }

    const deleteResult = await safeDbQuery(
      (client) => client.product.delete({ where: { id } }),
      { operationName: `DELETE /api/products/${id} (delete)` }
    )

    if (!deleteResult.success) {
      // Check if it's a foreign key constraint error
      const errMsg = deleteResult.error?.message || 'Unknown error'
      const isFkError = errMsg.toLowerCase().includes('foreign key') || errMsg.toLowerCase().includes('constraint')
      if (isFkError) {
        return errorResponse(
          'Cannot delete product: it is linked to existing orders or subscriptions. Deactivate it instead.',
          409
        )
      }
      return errorResponse(`Failed to delete product: ${errMsg}`, 500)
    }

    return jsonResponse({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error(`[API /products] Unexpected error deleting product:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unexpected error deleting product: ${message}`, 500)
  }
}
