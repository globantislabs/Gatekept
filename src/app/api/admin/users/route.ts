import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, sanitizeStringFields, stripSensitiveFieldsFromArray } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/admin/users - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''

    // Validate pagination params
    if (page < 1) {
      return errorResponse('page must be at least 1', 400)
    }
    if (limit < 1 || limit > 100) {
      return errorResponse('limit must be between 1 and 100', 400)
    }

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { user_id: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.userProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          name: true,
          email: true,
          phone: true,
          age: true,
          gender: true,
          country: true,
          state: true,
          avatar_url: true,
          is_admin: true,
          learning_completed: true,
          created_at: true,
          updated_at: true,
          // Exclude password_hash for security
        },
      }),
      db.userProfile.count({ where }),
    ])

    return jsonResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing users:', error)
    return errorResponse('Failed to fetch users', 500)
  }
}

// PUT /api/admin/users - Update user (admin)
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const body = await request.json()

    // Validate required fields
    const validationError = validateRequired(body, ['id'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'email', 'phone', 'gender', 'country', 'state'])

    const { id, is_admin, age, learning_completed } = sanitized

    // Verify user exists
    const existing = await db.userProfile.findUnique({ where: { id: id as string } })
    if (!existing) {
      return errorResponse('User not found', 404)
    }

    // Never allow updating password_hash through this endpoint
    const updateData: Record<string, unknown> = {}
    if (is_admin !== undefined) updateData.is_admin = is_admin
    if (sanitized.name !== undefined) updateData.name = sanitized.name
    if (sanitized.email !== undefined) updateData.email = sanitized.email
    if (sanitized.phone !== undefined) updateData.phone = sanitized.phone
    if (age !== undefined) updateData.age = Number(age)
    if (sanitized.gender !== undefined) updateData.gender = sanitized.gender
    if (sanitized.country !== undefined) updateData.country = sanitized.country
    if (sanitized.state !== undefined) updateData.state = sanitized.state
    if (learning_completed !== undefined) updateData.learning_completed = learning_completed

    const user = await db.userProfile.update({
      where: { id: id as string },
      data: updateData,
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        country: true,
        state: true,
        avatar_url: true,
        is_admin: true,
        learning_completed: true,
        created_at: true,
        updated_at: true,
        // Exclude password_hash for security - never expose
      },
    })

    return jsonResponse({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return errorResponse('Failed to update user', 500)
  }
}
