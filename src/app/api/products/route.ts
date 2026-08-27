import { db, safeDbQuery } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, validateNumeric, sanitizeStringFields } from '@/lib/api-utils'
import { Prisma } from '@prisma/client'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// ─── Helper: Check if error is a missing column/table error ─────
function isSchemaMismatchError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: Table does not exist, P2022: Column does not exist
    return error.errorCode === 'P2021' || error.errorCode === 'P2022'
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('unknown column') || msg.includes("doesn't exist")
  }
  return false
}

// ─── Helper: Build a safe "select" that works with or without qr_code_url ──
// Uses explicit column selection to avoid "unknown column" errors.
// If qr_code_url doesn't exist in the production DB, the fallback
// query (without select) will still work.
function getSafeProductSelect() {
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
    // qr_code_url excluded from safe select — column may not exist in production DB
    created_at: true,
    updated_at: true,
  }
}

// GET /api/products - List all products with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const featured = searchParams.get('featured')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}

    if (active !== null) {
      where.active = active === 'true'
    }
    if (featured !== null) {
      where.featured = featured === 'true'
    }
    if (type) {
      where.type = type
    }
    if (category) {
      where.category = category
    }

    // Use safe select first to avoid schema mismatch errors on production
    // (e.g., qr_code_url column may not exist in production DB yet)
    const safeSelect = getSafeProductSelect()

    const result = await safeDbQuery(
      (client) => client.product.findMany({
        where,
        orderBy: { created_at: 'desc' },
        select: safeSelect,
      }),
      { operationName: 'GET /api/products (findMany safe select)' }
    )

    if (result.success) {
      // Add qr_code_url: null to each product so the API contract is consistent
      const products = result.data!.map((p: Record<string, unknown>) => ({ ...p, qr_code_url: (p as Record<string, unknown>).qr_code_url ?? null }))
      return jsonResponse({ products, total: products.length })
    }

    // If the safe select also fails, try without select (full include)
    if (result.error?.type === 'schema' || isSchemaMismatchError(result.error?.originalError)) {
      console.warn('[API /products] Safe select failed, trying findMany without select')

      const fallbackResult = await safeDbQuery(
        (client) => client.product.findMany({
          where,
          orderBy: { created_at: 'desc' },
        }),
        { operationName: 'GET /api/products (findMany fallback without select)' }
      )

      if (fallbackResult.success) {
        const products = fallbackResult.data!.map((p: Record<string, unknown>) => ({ ...p, qr_code_url: (p as Record<string, unknown>).qr_code_url ?? null }))
        return jsonResponse({ products, total: products.length })
      }

      // Fallback also failed
      console.error('[API /products] All queries failed:', fallbackResult.error?.message)
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
    return errorResponse(`Failed to fetch products: ${errorMsg}`, 500)
  } catch (error) {
    console.error('[API /products] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unexpected error fetching products: ${message}`, 500)
  }
}

// POST /api/products - Create a product (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const body = await request.json()

    // Validate required fields
    const validationError = validateRequired(body, ['name', 'slug'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    if (body.price === undefined) {
      return errorResponse('price is required', 400)
    }

    // Validate numeric fields
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

    const {
      name,
      slug,
      description,
      short_description,
      price,
      subscription_plans,
      mrp,
      stock,
      image_url,
      gallery_images,
      type,
      category,
      sku,
      weight,
      ingredients,
      nutrition_info,
      tags,
      active,
      featured,
      serving_size,
      allergen_info,
      storage_info,
      shelf_life,
      country_origin,
      fssai_license,
      hsn_code,
      gst_rate,
      min_order_qty,
      max_order_qty,
      discount_label,
      highlights,
      qr_code_url,
    } = sanitized

    // Check slug uniqueness
    const slugResult = await safeDbQuery(
      (client) => client.product.findUnique({ where: { slug: slug as string } }),
      { operationName: 'POST /api/products (slug check)' }
    )
    if (!slugResult.success) {
      return errorResponse(
        `Database error checking slug uniqueness: ${slugResult.error?.message || 'Unknown error'}`,
        500
      )
    }
    if (slugResult.data) {
      return errorResponse('Product with this slug already exists', 400)
    }

    const productData = {
      name: name as string,
      slug: slug as string,
      description: description as string || null,
      short_description: short_description as string || null,
      price: parseFloat(String(price)),
      mrp: mrp ? parseFloat(String(mrp)) : null,
      stock: stock ? parseInt(String(stock)) : 0,
      image_url: image_url as string || null,
      gallery_images: gallery_images as string || null,
      type: type as string || 'FIZZ',
      category: category as string || null,
      sku: sku as string || null,
      weight: weight as string || null,
      ingredients: ingredients as string || null,
      nutrition_info: nutrition_info as string || null,
      tags: tags as string || null,
      active: typeof active === 'boolean' ? active : true,
      featured: typeof featured === 'boolean' ? featured : false,
      subscription_plans: subscription_plans || null,
      serving_size: serving_size as string || null,
      allergen_info: allergen_info as string || null,
      storage_info: storage_info as string || null,
      shelf_life: shelf_life as string || null,
      country_origin: country_origin as string || 'India',
      fssai_license: fssai_license as string || null,
      hsn_code: hsn_code as string || null,
      gst_rate: gst_rate ? parseFloat(String(gst_rate)) : 18,
      min_order_qty: min_order_qty ? parseInt(String(min_order_qty)) : 1,
      max_order_qty: max_order_qty ? parseInt(String(max_order_qty)) : 10,
      discount_label: discount_label as string || null,
      highlights: highlights as string || null,
      qr_code_url: qr_code_url as string || null,
    }

    const createResult = await safeDbQuery(
      (client) => client.product.create({ data: productData }),
      { operationName: 'POST /api/products (create)' }
    )

    if (!createResult.success) {
      // If qr_code_url column doesn't exist in production, retry without it
      if (createResult.error?.type === 'schema' || isSchemaMismatchError(createResult.error?.originalError)) {
        console.warn('[API /products] qr_code_url column missing, creating product without it')
        const { qr_code_url: _qrc, ...dataWithoutQr } = productData
        const fallbackResult = await safeDbQuery(
          (client) => client.product.create({ data: dataWithoutQr }),
          { operationName: 'POST /api/products (create without qr_code_url)' }
        )
        if (fallbackResult.success) {
          return jsonResponse({ product: { ...fallbackResult.data, qr_code_url: null } }, 201)
        }
        return errorResponse(
          `Failed to create product: ${fallbackResult.error?.message || 'Unknown error'}`,
          500
        )
      }
      return errorResponse(
        `Failed to create product: ${createResult.error?.message || 'Unknown error'}`,
        500
      )
    }

    const product = createResult.data!

    // Auto-generate QR code URL if not provided
    if (!product.qr_code_url) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://notjustwatr.com'
      const qrUrl = `${baseUrl}/product?product=${product.slug}`
      const updateResult = await safeDbQuery(
        (client) => client.product.update({
          where: { id: product.id },
          data: { qr_code_url: qrUrl },
        }),
        { operationName: 'POST /api/products (update qr_code_url)' }
      )
      if (updateResult.success) {
        product.qr_code_url = qrUrl
      } else {
        // Non-fatal: QR code URL update failed, but product was created
        console.warn('[API /products] Failed to update qr_code_url:', updateResult.error?.message)
      }
    }

    return jsonResponse({ product }, 201)
  } catch (error) {
    console.error('[API /products] Unexpected error creating product:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(`Unexpected error creating product: ${message}`, 500)
  }
}
