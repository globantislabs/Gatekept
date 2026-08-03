import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, sanitizeStringFields, hashPassword } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// DELETE /api/admin/users/[id] — Delete a user by ID (admin only)
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

    // Prevent self-deletion: check x-user-id header against the :id param
    const adminUserId = request.headers.get('x-user-id')
    if (adminUserId && adminUserId === id) {
      return errorResponse('Cannot delete your own account', 400)
    }

    // Verify user exists
    const existing = await db.userProfile.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('User not found', 404)
    }

    // Prevent deleting the last admin user
    if (existing.is_admin) {
      const adminCount = await db.userProfile.count({
        where: { is_admin: true },
      })
      if (adminCount <= 1) {
        return errorResponse('Cannot delete the last admin user', 400)
      }
    }

    // Delete the user
    await db.userProfile.delete({ where: { id } })

    return jsonResponse({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return errorResponse('Failed to delete user', 500)
  }
}

// PUT /api/admin/users/[id] — Update a user by ID (admin only)
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

    // Verify user exists
    const existing = await db.userProfile.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('User not found', 404)
    }

    const body = await request.json()

    // Sanitize string fields
    const sanitized = sanitizeStringFields(body, ['name', 'email', 'phone', 'gender', 'country', 'state'])

    const { is_admin, age, learning_completed, new_password } = sanitized

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (sanitized.name !== undefined) updateData.name = sanitized.name
    if (sanitized.email !== undefined) updateData.email = sanitized.email
    if (sanitized.phone !== undefined) updateData.phone = sanitized.phone
    if (age !== undefined) updateData.age = Number(age)
    if (sanitized.gender !== undefined) updateData.gender = sanitized.gender
    if (sanitized.country !== undefined) updateData.country = sanitized.country
    if (sanitized.state !== undefined) updateData.state = sanitized.state
    if (is_admin !== undefined) updateData.is_admin = is_admin
    if (learning_completed !== undefined) updateData.learning_completed = learning_completed

    // Hash new password if provided
    if (new_password !== undefined) {
      if (typeof new_password !== 'string' || new_password.length < 6) {
        return errorResponse('New password must be at least 6 characters', 400)
      }
      updateData.password_hash = hashPassword(new_password)
    }

    // Check for duplicate email before updating
    if (sanitized.email !== undefined && sanitized.email !== existing.email) {
      const emailExists = await db.userProfile.findUnique({
        where: { email: sanitized.email as string },
      })
      if (emailExists) {
        return errorResponse('This email is already used by another account', 409)
      }
    }

    // Check for duplicate phone before updating
    if (sanitized.phone !== undefined && sanitized.phone !== existing.phone) {
      const phoneExists = await db.userProfile.findUnique({
        where: { phone: sanitized.phone as string },
      })
      if (phoneExists) {
        return errorResponse('This phone number is already used by another account', 409)
      }
    }

    // Prevent demoting the last admin user
    if (is_admin === false && existing.is_admin) {
      const adminCount = await db.userProfile.count({
        where: { is_admin: true },
      })
      if (adminCount <= 1) {
        return errorResponse('Cannot remove admin status from the last admin user', 400)
      }
    }

    const user = await db.userProfile.update({
      where: { id },
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
        // Exclude password_hash for security — never expose
      },
    })

    return jsonResponse({ user })
  } catch (error: any) {
    console.error('Error updating user:', error)

    // Handle Prisma unique constraint errors as a safety net
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'field'
      if (field === 'email') return errorResponse('This email is already used by another account', 409)
      if (field === 'phone') return errorResponse('This phone number is already used by another account', 409)
      return errorResponse(`This ${field} is already taken`, 409)
    }

    return errorResponse('Failed to update user', 500)
  }
}
