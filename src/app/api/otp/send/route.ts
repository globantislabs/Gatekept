import { NextRequest, NextResponse } from 'next/server'
import { smsAlertService } from '@/lib/smsalert-service'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// Handle CORS preflight
export async function OPTIONS() { return handleOptions() }

// POST /api/otp/send — Send OTP to user's registered phone number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, purpose, reference_id } = body

    // Validate required fields
    if (!user_id || !purpose) {
      return errorResponse('user_id and purpose are required', 400)
    }

    // Valid purposes
    const validPurposes = ['CANCEL_ORDER', 'CANCEL_SUB', 'PAUSE_SUB', 'RESUME_SUB', 'MODIFY_ADDRESS', 'VERIFY_PHONE']
    if (!validPurposes.includes(purpose)) {
      return errorResponse('Invalid OTP purpose', 400)
    }

    // Look up user's phone number from database
    const user = await db.userProfile.findUnique({ where: { id: user_id } })
    if (!user) {
      return errorResponse('User not found', 404)
    }

    if (!user.phone) {
      return errorResponse('No phone number registered. Please add a phone number to your profile first.', 400)
    }

    // If reference_id is provided, validate ownership
    if (reference_id) {
      if (purpose === 'CANCEL_ORDER') {
        const order = await db.order.findUnique({ where: { id: reference_id } })
        if (!order || order.user_id !== user_id) {
          return errorResponse('Order not found or does not belong to you', 403)
        }
        if (order.status !== 'PLACED' && order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
          return errorResponse('Order cannot be cancelled at this stage', 400)
        }
      } else if (['CANCEL_SUB', 'PAUSE_SUB', 'RESUME_SUB'].includes(purpose)) {
        const sub = await db.subscription.findUnique({ where: { id: reference_id } })
        if (!sub || sub.user_id !== user_id) {
          return errorResponse('Subscription not found or does not belong to you', 403)
        }
      } else if (purpose === 'MODIFY_ADDRESS') {
        const order = await db.order.findUnique({ where: { id: reference_id } })
        if (!order || order.user_id !== user_id) {
          return errorResponse('Order not found or does not belong to you', 403)
        }
        if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
          return errorResponse('Address can only be modified before shipping', 400)
        }
      }
    }

    // Send OTP via SMSAlert
    const result = await smsAlertService.sendOtp(
      user.phone,
      purpose as any,
      user_id,
      reference_id
    )

    return jsonResponse({
      success: result.success,
      otp_id: result.otpId,
      message: result.message,
      phone_masked: result.phoneMasked,
    })
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to send OTP', 500)
  }
}
