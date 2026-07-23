import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, verifyPassword, stripSensitiveFields } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/login - Login with email/phone + password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password } = body

    if (!password) {
      return errorResponse('Password is required', 400)
    }

    if (!email && !phone) {
      return errorResponse('Email or phone is required', 400)
    }

    // Validate and sanitize inputs
    if (email && typeof email !== 'string') {
      return errorResponse('Email must be a string', 400)
    }
    if (phone && typeof phone !== 'string') {
      return errorResponse('Phone must be a string', 400)
    }
    if (typeof password !== 'string' || password.length < 1) {
      return errorResponse('Invalid password format', 400)
    }

    // Find user by email or phone
    let user = null
    if (email) {
      user = await db.userProfile.findUnique({ where: { email } })
    } else if (phone) {
      // Find by phone - need to use findFirst since phone is not unique
      user = await db.userProfile.findFirst({ where: { phone } })
    }

    if (!user) {
      // Always return same error to prevent user enumeration
      return errorResponse('Invalid credentials', 401)
    }

    // Check password using SHA-256 hash comparison
    if (!user.password_hash) {
      return errorResponse('Invalid credentials', 401)
    }

    if (!verifyPassword(password, user.password_hash)) {
      return errorResponse('Invalid credentials', 401)
    }

    // Create a simple session token (in production, use JWT or proper session management)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Return user profile (excluding password_hash) and set session cookie
    const safeUser = stripSensitiveFields(user)

    const response = jsonResponse({
      user: safeUser,
      token: sessionToken,
      message: 'Login successful',
    })

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error during login:', error)
    return errorResponse('Login failed', 500)
  }
}
