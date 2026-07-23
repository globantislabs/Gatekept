import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, checkAdmin, handleOptions, sanitizeString } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// PUT /api/products/[id]/quizzes/[quizId] - Update quiz (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id, quizId } = await params
    const body = await request.json()

    // Verify quiz exists and belongs to product
    const existing = await db.productQuiz.findFirst({
      where: { id: quizId, product_id: id },
    })
    if (!existing) {
      return errorResponse('Quiz not found', 404)
    }

    const allowedFields = [
      'video_id', 'question', 'options', 'answer', 'category', 'difficulty', 'order', 'active',
    ]

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Sanitize question if provided
    if (updateData.question !== undefined && typeof updateData.question === 'string') {
      updateData.question = sanitizeString(updateData.question as string, 500)
    }

    // Validate and stringify options if it's an array
    if (updateData.options !== undefined) {
      if (typeof updateData.options !== 'string') {
        if (!Array.isArray(updateData.options) || updateData.options.length < 2) {
          return errorResponse('options must be an array with at least 2 choices', 400)
        }
        updateData.options = JSON.stringify(updateData.options)
      }
    }

    // Validate and parse answer to int if needed
    if (updateData.answer !== undefined) {
      const answerIdx = parseInt(String(updateData.answer), 10)
      if (isNaN(answerIdx) || answerIdx < 0) {
        return errorResponse('answer must be a valid non-negative integer', 400)
      }
      updateData.answer = answerIdx
    }

    // Parse order to int
    if (updateData.order !== undefined) {
      updateData.order = parseInt(String(updateData.order), 10)
    }

    const quiz = await db.productQuiz.update({
      where: { id: quizId },
      data: updateData,
    })

    // Return with parsed options
    return jsonResponse({
      quiz: {
        ...quiz,
        options: JSON.parse(quiz.options),
      },
    })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return errorResponse('Failed to update quiz', 500)
  }
}

// DELETE /api/products/[id]/quizzes/[quizId] - Delete quiz (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const isAdmin = await checkAdmin(request)
    if (!isAdmin) {
      return errorResponse('Unauthorized: Admin access required', 403)
    }

    const { id, quizId } = await params

    // Verify quiz exists and belongs to product
    const existing = await db.productQuiz.findFirst({
      where: { id: quizId, product_id: id },
    })
    if (!existing) {
      return errorResponse('Quiz not found', 404)
    }

    await db.productQuiz.delete({ where: { id: quizId } })

    return jsonResponse({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return errorResponse('Failed to delete quiz', 500)
  }
}
