import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, validateRequired, sanitizeString } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/products/[id]/quizzes - List quizzes for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return errorResponse('Product not found', 404)
    }

    const quizzes = await db.productQuiz.findMany({
      where: { product_id: id },
      orderBy: { order: 'asc' },
      include: {
        video: {
          select: { id: true, title: true },
        },
      },
    })

    // Parse options from JSON strings
    const parsedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      options: JSON.parse(quiz.options),
    }))

    return jsonResponse({ quizzes: parsedQuizzes, total: parsedQuizzes.length })
  } catch (error) {
    console.error('Error listing quizzes:', error)
    return errorResponse('Failed to fetch quizzes', 500)
  }
}

// POST /api/products/[id]/quizzes - Create quiz for product (admin only)
export async function POST(
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

    // Validate required fields
    const validationError = validateRequired(body, ['video_id', 'question'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    if (body.options === undefined) {
      return errorResponse('options is required', 400)
    }
    if (body.answer === undefined) {
      return errorResponse('answer is required', 400)
    }

    // Sanitize question string
    const safeQuestion = sanitizeString(body.question, 500)

    // Verify product exists
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return errorResponse('Product not found', 404)
    }

    const {
      video_id,
      options,
      answer,
      difficulty,
      order,
      active,
    } = body

    // Verify video exists and belongs to product
    const video = await db.productVideo.findFirst({
      where: { id: video_id, product_id: id },
    })
    if (!video) {
      return errorResponse('Video not found or does not belong to this product', 400)
    }

    // Validate options is an array with at least 2 choices
    if (typeof options !== 'object' || !Array.isArray(options) || options.length < 2) {
      return errorResponse('options must be an array with at least 2 choices', 400)
    }

    // Validate answer is a valid index
    const answerIdx = parseInt(String(answer), 10)
    if (isNaN(answerIdx) || answerIdx < 0 || answerIdx >= options.length) {
      return errorResponse('answer must be a valid index within options array', 400)
    }

    // Stringify options for storage
    const optionsStr = typeof options === 'string' ? options : JSON.stringify(options)

    const quiz = await db.productQuiz.create({
      data: {
        product_id: id,
        video_id,
        question: safeQuestion,
        options: optionsStr,
        answer: answerIdx,
        difficulty: difficulty ?? 'EASY',
        order: order ?? 0,
        active: active ?? true,
      },
    })

    // Return with parsed options
    return jsonResponse({
      quiz: {
        ...quiz,
        options: JSON.parse(quiz.options),
      },
    }, 201)
  } catch (error) {
    console.error('Error creating quiz:', error)
    return errorResponse('Failed to create quiz', 500)
  }
}
