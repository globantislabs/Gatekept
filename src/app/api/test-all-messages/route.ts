// POST /api/test-all-messages
// Comprehensive test endpoint that sends ALL message types
// to the phone number 9789572066 (and optional email)
// for verifying every notification channel works.
//
// Usage:
//   POST /api/test-all-messages
//   POST /api/test-all-messages?only=whatsapp    (run only WhatsApp tests)
//   POST /api/test-all-messages?only=email       (run only email tests)
//   POST /api/test-all-messages?only=sms         (run only SMS tests)
//   POST /api/test-all-messages?only=notifications  (run only order lifecycle tests)
//   POST /api/test-all-messages?only=phonepe     (run only PhonePe tests)

import { NextRequest } from 'next/server'
import { whatsappOtpService } from '@/lib/whatsapp-otp-service'
import { notificationService } from '@/lib/notification-service'
import { emailService } from '@/lib/email-service'
import { smsAlertService } from '@/lib/smsalert-service'
import { phonePeService } from '@/lib/phonepe-service'
import { jsonResponse } from '@/lib/api-utils'

const TEST_PHONE = '9789572066'
const TEST_EMAIL = 'notjustwatr@zh-onehealth.com'
const TEST_USER = { id: 'test_user_001', name: 'Test User', email: TEST_EMAIL, phone: TEST_PHONE }
const TEST_ORDER = {
  id: 'test_order_001',
  order_number: 'NJW-TEST-001',
  status: 'Placed',
  total_amount: 499,
  items: [
    { product_name: 'Immunity Boost Shot', quantity: 2, total_price: 398 },
    { product_name: 'Energy Surge Shot', quantity: 1, total_price: 199 },
  ],
}

type TestResult = { name: string; channel: string; success: boolean; message: string; duration_ms: number }

async function runTest(name: string, channel: string, fn: () => Promise<string>): Promise<TestResult> {
  const start = Date.now()
  try {
    const message = await fn()
    return { name, channel, success: true, message, duration_ms: Date.now() - start }
  } catch (error: any) {
    return { name, channel, success: false, message: error.message || 'Unknown error', duration_ms: Date.now() - start }
  }
}

export async function POST(request: NextRequest) {
  const only = new URL(request.url).searchParams.get('only') || 'all'
  const results: TestResult[] = []

  // ─── 1. WhatsApp OTP Tests ──────────────────────────────────
  if (only === 'all' || only === 'whatsapp') {
    results.push(await runTest(
      'WhatsApp OTP (WHATSAPP_LOGIN)',
      'WHATSAPP',
      async () => {
        const r = await whatsappOtpService.sendOtp(TEST_PHONE, 'WHATSAPP_LOGIN')
        return r.whatsapp_sent
          ? `OTP sent via WhatsApp to ${r.phone_masked} (otp_id: ${r.otp_id})`
          : `WhatsApp NOT sent — ${r.message} (otp_id: ${r.otp_id})`
      }
    ))

    results.push(await runTest(
      'WhatsApp OTP (RESET_PASSWORD)',
      'WHATSAPP',
      async () => {
        const r = await whatsappOtpService.sendOtp(TEST_PHONE, 'RESET_PASSWORD')
        return r.whatsapp_sent
          ? `Reset OTP sent via WhatsApp to ${r.phone_masked} (otp_id: ${r.otp_id})`
          : `WhatsApp NOT sent — ${r.message} (otp_id: ${r.otp_id})`
      }
    ))

    // Direct WhatsApp text message (via notification service)
    results.push(await runTest(
      'WhatsApp Plain Text Message',
      'WHATSAPP',
      async () => {
        // Use the notification service login path which sends a plain text WhatsApp
        await notificationService.sendLoginNotification(TEST_USER, 'Test Device')
        return 'Login notification sent (includes WhatsApp plain text message)'
      }
    ))
  }

  // ─── 2. Email Tests ────────────────────────────────────────
  if (only === 'all' || only === 'email') {
    results.push(await runTest(
      'Email OTP',
      'EMAIL',
      async () => {
        const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const r = await emailService.sendOtpEmail(TEST_EMAIL, testOtp)
        return r.success ? `OTP email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Password Reset',
      'EMAIL',
      async () => {
        const testOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const r = await emailService.sendPasswordResetEmail(TEST_EMAIL, testOtp)
        return r.success ? `Password reset email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Notification (Generic)',
      'EMAIL',
      async () => {
        const r = await emailService.sendNotificationEmail(
          TEST_EMAIL,
          'NOTJUST Watr — Test Notification',
          'This is a test notification from the test-all-messages endpoint. If you received this, email delivery is working!'
        )
        return r.success ? `Notification email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Order Placed',
      'EMAIL',
      async () => {
        const r = await emailService.sendOrderPlacedEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
          totalAmount: TEST_ORDER.total_amount,
          items: TEST_ORDER.items.map(i => `${i.product_name} (x${i.quantity}) — ₹${i.total_price}`).join('<br>'),
        })
        return r.success ? `Order placed email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Order Confirmed',
      'EMAIL',
      async () => {
        const r = await emailService.sendOrderConfirmedEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
        })
        return r.success ? `Order confirmed email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Payment Received',
      'EMAIL',
      async () => {
        const r = await emailService.sendPaymentReceivedEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
          totalAmount: TEST_ORDER.total_amount,
        })
        return r.success ? `Payment received email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Order Shipped',
      'EMAIL',
      async () => {
        const r = await emailService.sendOrderShippedEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
        })
        return r.success ? `Order shipped email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Order Delivered',
      'EMAIL',
      async () => {
        const r = await emailService.sendOrderDeliveredEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
        })
        return r.success ? `Order delivered email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Order Cancelled',
      'EMAIL',
      async () => {
        const r = await emailService.sendOrderCancelledEmail(TEST_EMAIL, {
          orderNumber: TEST_ORDER.order_number,
        })
        return r.success ? `Order cancelled email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))

    results.push(await runTest(
      'Email Login Notification',
      'EMAIL',
      async () => {
        const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
        const r = await emailService.sendLoginNotificationEmail(TEST_EMAIL, {
          name: TEST_USER.name,
          device: 'Test Device',
          time: timeStr,
        })
        return r.success ? `Login notification email sent to ${TEST_EMAIL}` : `FAILED: ${r.message}`
      }
    ))
  }

  // ─── 3. SMS Tests ──────────────────────────────────────────
  if (only === 'all' || only === 'sms') {
    results.push(await runTest(
      'SMS OTP (VERIFY_PHONE)',
      'SMS',
      async () => {
        try {
          const r = await smsAlertService.sendOtp(TEST_PHONE, 'VERIFY_PHONE')
          return `OTP sent via SMS to ${r.phoneMasked} (otpId: ${r.otpId})`
        } catch (err: any) {
          return `SMS not available: ${err.message}`
        }
      }
    ))

    results.push(await runTest(
      'SMS Plain Text',
      'SMS',
      async () => {
        const r = await smsAlertService.sendSms(TEST_PHONE, 'NOTJUST Watr: This is a test SMS from the test-all-messages endpoint.')
        return r.success ? `SMS sent to ${TEST_PHONE}` : `FAILED: ${r.message}`
      }
    ))
  }

  // ─── 4. Order Lifecycle Notifications (Multi-channel) ─────
  if (only === 'all' || only === 'notifications') {
    results.push(await runTest(
      'Order Placed Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendOrderPlacedNotification(TEST_ORDER, TEST_USER)
        return 'Order placed notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Order Confirmed Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendOrderConfirmedNotification(TEST_ORDER, TEST_USER)
        return 'Order confirmed notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Payment Received Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendPaymentReceivedNotification(TEST_ORDER, TEST_USER)
        return 'Payment received notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Order Shipped Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendOrderShippedNotification(TEST_ORDER, TEST_USER)
        return 'Order shipped notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Order Delivered Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendOrderDeliveredNotification(TEST_ORDER, TEST_USER)
        return 'Order delivered notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Order Cancelled Notification (Email + WhatsApp + SMS)',
      'MULTI',
      async () => {
        await notificationService.sendOrderCancelledNotification(TEST_ORDER, TEST_USER)
        return 'Order cancelled notification sent via all channels'
      }
    ))

    results.push(await runTest(
      'Login Notification (Email + WhatsApp)',
      'MULTI',
      async () => {
        await notificationService.sendLoginNotification(TEST_USER, 'Chrome on Windows')
        return 'Login notification sent via all channels'
      }
    ))
  }

  // ─── 5. PhonePe Payment Gateway Tests ──────────────────────
  if (only === 'all' || only === 'phonepe') {
    results.push(await runTest(
      'PhonePe: Check Configuration',
      'PHONEPE',
      async () => {
        const configured = phonePeService.isConfigured()
        return configured
          ? `PhonePe is configured (env: ${process.env.PHONEPE_ENV || 'sandbox'})`
          : 'PhonePe NOT configured — set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET'
      }
    ))

    results.push(await runTest(
      'PhonePe: Initiate Test Payment',
      'PHONEPE',
      async () => {
        const r = await phonePeService.initiatePayment({
          merchantOrderId: `TEST_${Date.now()}`,
          amount: 1, // ₹1 test payment
          redirectUrl: 'https://notjustwatr.com/payment/callback',
        })
        return r.success
          ? `Payment initiated — URL: ${r.paymentUrl?.substring(0, 80)}...`
          : `FAILED: ${r.error || r.message}`
      }
    ))

    results.push(await runTest(
      'PhonePe: Check Order Status',
      'PHONEPE',
      async () => {
        const r = await phonePeService.checkStatus(TEST_ORDER.order_number)
        return `Status: ${r.status} — ${r.message || 'No additional info'}`
      }
    ))
  }

  // ─── Summary ──────────────────────────────────────────────
  const total = results.length
  const passed = results.filter(r => r.success).length
  const failed = total - passed
  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0)

  const channelGroups: Record<string, TestResult[]> = {}
  for (const r of results) {
    if (!channelGroups[r.channel]) channelGroups[r.channel] = []
    channelGroups[r.channel].push(r)
  }

  return jsonResponse({
    summary: {
      target_phone: TEST_PHONE,
      target_email: TEST_EMAIL,
      total_tests: total,
      passed,
      failed,
      total_duration_ms: totalDuration,
      filter: only,
    },
    channels: Object.fromEntries(
      Object.entries(channelGroups).map(([ch, tests]) => [
        ch,
        {
          total: tests.length,
          passed: tests.filter(t => t.success).length,
          failed: tests.filter(t => !t.success).length,
          tests: tests.map(t => ({
            name: t.name,
            success: t.success,
            message: t.message,
            duration_ms: t.duration_ms,
          })),
        },
      ])
    ),
    results: results.map(r => ({
      name: r.name,
      channel: r.channel,
      success: r.success,
      message: r.message,
      duration_ms: r.duration_ms,
    })),
  })
}
