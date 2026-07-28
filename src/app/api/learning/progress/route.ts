import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, handleOptions, validateRequired, validateNumeric } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/learning/progress - Get learning progress for user+product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const product_id = searchParams.get('product_id')

    if (!user_id) {
      return errorResponse('user_id query parameter is required', 400)
    }

    // Validate user_id format (should be a cuid-like string)
    if (user_id.length > 50) {
      return errorResponse('Invalid user_id format', 400)
    }

    if (product_id) {
      // Get progress for specific product
      const progress = await db.productLearningProgress.findUnique({
        where: {
          user_id_product_id: { user_id, product_id },
        },
      })

      if (!progress) {
        // Return empty progress instead of 404 — client handles null case
        return jsonResponse({ progress: null })
      }

      // Parse JSON fields
      return jsonResponse({
        progress: {
          ...progress,
          video_progress: JSON.parse(progress.video_progress),
          quiz_answers: JSON.parse(progress.quiz_answers),
        },
      })
    } else {
      // Get all progress for user
      const progressList = await db.productLearningProgress.findMany({
        where: { user_id },
        include: {
          product: {
            select: { id: true, name: true, slug: true, image_url: true },
          },
        },
        orderBy: { updated_at: 'desc' },
      })

      // Parse JSON fields
      const parsed = progressList.map((p) => ({
        ...p,
        video_progress: JSON.parse(p.video_progress),
        quiz_answers: JSON.parse(p.quiz_answers),
      }))

      return jsonResponse({ progress: parsed, total: parsed.length })
    }
  } catch (error) {
    console.error('Error fetching learning progress:', error)
    return errorResponse('Failed to fetch learning progress', 500)
  }
}

// POST /api/learning/progress - Save/update learning progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const validationError = validateRequired(body, ['user_id', 'product_id'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Validate numeric fields
    const numericError = validateNumeric(body, {
      quiz_score: { min: 0, max: 100, integer: true },
    })
    if (numericError) {
      return errorResponse(numericError, 400)
    }

    // Validate status is one of allowed values
    if (body.status && !['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(body.status)) {
      return errorResponse('status must be NOT_STARTED, IN_PROGRESS, or COMPLETED', 400)
    }

    const {
      user_id,
      product_id,
      video_progress,
      quiz_answers,
      quiz_completed,
      quiz_score,
      status,
    } = body

    // Verify user exists
    const user = await db.userProfile.findUnique({ where: { id: user_id } })
    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: product_id } })
    if (!product) {
      return errorResponse('Product not found', 404)
    }

    // Stringify JSON fields for storage
    const videoProgressStr = typeof video_progress === 'string'
      ? video_progress
      : JSON.stringify(video_progress ?? {})
    const quizAnswersStr = typeof quiz_answers === 'string'
      ? quiz_answers
      : JSON.stringify(quiz_answers ?? {})

    // Check if progress already exists
    const existing = await db.productLearningProgress.findUnique({
      where: {
        user_id_product_id: { user_id, product_id },
      },
    })

    let progress

    if (existing) {
      // Update existing progress
      const updateData: Record<string, unknown> = {}
      if (video_progress !== undefined) updateData.video_progress = videoProgressStr
      if (quiz_answers !== undefined) updateData.quiz_answers = quizAnswersStr
      if (quiz_completed !== undefined) updateData.quiz_completed = quiz_completed
      if (quiz_score !== undefined) updateData.quiz_score = parseInt(String(quiz_score), 10)
      if (status !== undefined) updateData.status = status
      if (quiz_completed === true) updateData.completed_at = new Date()

      progress = await db.productLearningProgress.update({
        where: { id: existing.id },
        data: updateData,
      })

      // If status is COMPLETED, update user's learning_completed flag
      if (status === 'COMPLETED') {
        await db.userProfile.update({
          where: { id: user_id },
          data: { learning_completed: true },
        })
      }
    } else {
      // Create new progress
      progress = await db.productLearningProgress.create({
        data: {
          user_id,
          product_id,
          video_progress: videoProgressStr,
          quiz_answers: quizAnswersStr,
          quiz_completed: quiz_completed ?? false,
          quiz_score: quiz_score ?? 0,
          status: status ?? 'NOT_STARTED',
          completed_at: quiz_completed ? new Date() : undefined,
        },
      })

      // If status is COMPLETED on creation, update user's learning_completed flag
      if (status === 'COMPLETED') {
        await db.userProfile.update({
          where: { id: user_id },
          data: { learning_completed: true },
        })
      }
    }

    // Return with parsed JSON fields
    return jsonResponse({
      progress: {
        ...progress,
        video_progress: JSON.parse(progress.video_progress),
        quiz_answers: JSON.parse(progress.quiz_answers),
      },
    }, existing ? 200 : 201)
  } catch (error) {
    console.error('Error saving learning progress:', error)
    return errorResponse('Failed to save learning progress', 500)
  }
}
