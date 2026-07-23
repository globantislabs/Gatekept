import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, hashPassword, stripSensitiveFields, sanitizeString, validateRequired } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      password,
      age,
      gender,
      country,
      state,
      avatar_url,
    } = body

    // Validate required fields
    const validationError = validateRequired(body, ['name'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    if (!email && !phone) {
      return errorResponse('Email or phone is required', 400)
    }

    if (!password) {
      return errorResponse('Password is required', 400)
    }

    // Validate password minimum length
    if (typeof password !== 'string' || password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400)
    }

    // Sanitize string inputs
    const safeName = sanitizeString(name, 100)
    const safeEmail = email ? sanitizeString(email, 255) : undefined
    const safePhone = phone ? sanitizeString(phone, 20) : undefined
    const safeGender = gender ? sanitizeString(gender, 20) : undefined
    const safeCountry = country ? sanitizeString(country, 50) : undefined
    const safeState = state ? sanitizeString(state, 50) : undefined

    // Check if email already exists
    if (safeEmail) {
      const existingEmail = await db.userProfile.findUnique({ where: { email: safeEmail } })
      if (existingEmail) {
        return errorResponse('Email already registered', 400)
      }
    }

    // Check if phone already exists
    if (safePhone) {
      const existingPhone = await db.userProfile.findFirst({ where: { phone: safePhone } })
      if (existingPhone) {
        return errorResponse('Phone number already registered', 400)
      }
    }

    // Generate a unique user_id
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Hash the password using SHA-256 before storing
    const password_hash = hashPassword(password)

    const user = await db.userProfile.create({
      data: {
        user_id: userId,
        name: safeName,
        email: safeEmail || null,
        phone: safePhone || null,
        password_hash,
        age: age ? Number(age) : null,
        gender: safeGender ?? null,
        country: safeCountry ?? 'India',
        state: safeState ?? null,
        avatar_url: avatar_url ?? null,
        is_admin: false,
        learning_completed: false,
      },
    })

    // Create a simple session token
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Return user profile (excluding password_hash) and set session cookie
    const safeUser = stripSensitiveFields(user)

    const response = jsonResponse({
      user: safeUser,
      token: sessionToken,
      message: 'Registration successful',
    }, 201)

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
    console.error('Error during registration:', error)
    return errorResponse('Registration failed', 500)
  }
}
