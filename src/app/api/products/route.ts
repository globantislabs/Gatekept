import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, validateNumeric, sanitizeStringFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
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

    const products = await db.product.findMany({
      where,
      orderBy: { created_at: 'desc' },
    })

    return jsonResponse({ products, total: products.length })
  } catch (error) {
    console.error('Error listing products:', error)
    return errorResponse('Failed to fetch products', 500)
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

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'slug', 'description', 'short_description', 'sku', 'type', 'category', 'brand', 'flavor'])

    const {
      name,
      slug,
      description,
      short_description,
      price,
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
      brand,
      flavor,
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
    } = sanitized

    // Check slug uniqueness
    const existing = await db.product.findUnique({ where: { slug: slug as string } })
    if (existing) {
      return errorResponse('Product with this slug already exists', 400)
    }

    const product = await db.product.create({
      data: {
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
        active: active === true ?? true,
        featured: featured === true ?? false,
        brand: brand as string || 'NOTJUST',
        flavor: flavor as string || null,
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
      },
    })

    return jsonResponse({ product }, 201)
  } catch (error) {
    console.error('Error creating product:', error)
    return errorResponse('Failed to create product', 500)
  }
}
