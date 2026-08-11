#!/usr/bin/env npx tsx
// ──────────────────────────────────────────────────────────────────
// NOTJUST Watr — Comprehensive Message Test Script
// ──────────────────────────────────────────────────────────────────
// Sends ALL message types to 9789572066 for verification.
// Runs standalone with Node.js — no Next.js server or DB needed.
//
// Usage:
//   npx tsx scripts/test-all-messages.ts              (run all)
//   npx tsx scripts/test-all-messages.ts whatsapp     (WhatsApp only)
//   npx tsx scripts/test-all-messages.ts email        (email only)
//   npx tsx scripts/test-all-messages.ts sms          (SMS only)
//   npx tsx scripts/test-all-messages.ts phonepe      (PhonePe only)
//   npx tsx scripts/test-all-messages.ts templates    (WhatsApp templates only)
// ──────────────────────────────────────────────────────────────────

import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createTransport } from 'nodemailer'

// ─── Load .env.production ──────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '..', '.env.production') })
dotenvConfig({ path: resolve(__dirname, '..', '.env') }) // dev fallback

// ─── Config from env ───────────────────────────────────────────
const PHONE = '9789572066'
const WHATSAPP_PHONE = `91${PHONE}` // 919789572066
const EMAIL = process.env.ZOHO_EMAIL || 'notjustwatr@zh-onehealth.com'

const WA_TOKEN = process.env.WHATSAPP_TOKEN || ''
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const WA_API_VERSION = 'v19.0'
const WA_BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_ID}/messages`

const ZOHO_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'
const ZOHO_PORT = parseInt(process.env.ZOHO_SMTP_PORT || '465')
const ZOHO_EMAIL = process.env.ZOHO_EMAIL || ''
const ZOHO_PASS = process.env.ZOHO_PASSWORD || ''

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID || ''
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || ''
const PHONEPE_ENV = process.env.PHONEPE_ENV || 'sandbox'
const PHONEPE_BASE = PHONEPE_ENV === 'production'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

// ─── Test tracking ─────────────────────────────────────────────
interface TestResult {
  name: string
  channel: string
  success: boolean
  message: string
  error?: string
  duration_ms: number
}

const results: TestResult[] = []
let passCount = 0
let failCount = 0

async function runTest(name: string, channel: string, fn: () => Promise<{ success: boolean; message: string; error?: string }>): Promise<void> {
  const start = Date.now()
  const icon = channel === 'WHATSAPP' ? '💬' : channel === 'EMAIL' ? '📧' : channel === 'SMS' ? '📲' : channel === 'PHONEPE' ? '💳' : '🔔'

  try {
    const result = await fn()
    const duration = Date.now() - start
    const r: TestResult = { name, channel, success: result.success, message: result.message, error: result.error, duration_ms: duration }
    results.push(r)

    if (result.success) {
      passCount++
      console.log(`  ✅ ${icon} ${name} (${duration}ms)`)
      if (result.message) console.log(`     → ${result.message}`)
    } else {
      failCount++
      console.log(`  ❌ ${icon} ${name} (${duration}ms)`)
      console.log(`     → ${result.message}`)
      if (result.error) console.log(`     → ERROR: ${result.error}`)
    }
  } catch (err: any) {
    const duration = Date.now() - start
    const r: TestResult = { name, channel, success: false, message: 'Exception thrown', error: err.message || String(err), duration_ms: duration }
    results.push(r)
    failCount++
    console.log(`  💥 ${icon} ${name} (${duration}ms)`)
    console.log(`     → EXCEPTION: ${err.message || err}`)
    if (err.stack) console.log(`     → Stack: ${err.stack.split('\n').slice(1, 3).join('\n     → ')}`)
  }
}

// ─── WhatsApp helpers ──────────────────────────────────────────
async function sendWhatsApp(payload: any): Promise<{ success: boolean; messageId?: string; error?: string; data?: any }> {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    return { success: false, error: 'WhatsApp credentials not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)' }
  }
  try {
    const res = await fetch(WA_BASE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) {
      return { success: false, error: `[${data.error.code}] ${data.error.message}`, data }
    }
    return { success: true, messageId: data.message_id, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ─── Email helper ──────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; message: string; error?: string }> {
  if (!ZOHO_EMAIL || !ZOHO_PASS) {
    return { success: false, message: 'Zoho SMTP not configured', error: 'Set ZOHO_EMAIL and ZOHO_PASSWORD in .env.production' }
  }
  try {
    const transporter = createTransport({
      host: ZOHO_HOST,
      port: ZOHO_PORT,
      secure: true,
      auth: { user: ZOHO_EMAIL, pass: ZOHO_PASS },
      tls: { rejectUnauthorized: false },
    })
    const result = await transporter.sendMail({ from: `"NOTJUST Watr" <${ZOHO_EMAIL}>`, to, subject, html, text })
    return { success: true, message: `Sent to ${to} (messageId: ${result.messageId})` }
  } catch (err: any) {
    return { success: false, message: 'Email delivery failed', error: err.message }
  }
}

// ─── PhonePe helper ────────────────────────────────────────────
let phonePeToken: string | null = null
async function getPhonePeToken(): Promise<string | null> {
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) return null
  try {
    const res = await fetch(`${PHONEPE_BASE}/v2/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: PHONEPE_CLIENT_ID, clientSecret: PHONEPE_CLIENT_SECRET }),
    })
    const data = await res.json()
    if (data.accessToken) { phonePeToken = data.accessToken; return phonePeToken }
    return null
  } catch { return null }
}

// ─── Test Groups ───────────────────────────────────────────────

async function testWhatsAppOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Test 1: Template message (otp_verification)
  await runTest('WhatsApp Template: otp_verification', 'WHATSAPP', async () => {
    const r = await sendWhatsApp({
      messaging_product: 'whatsapp',
      to: WHATSAPP_PHONE,
      type: 'template',
      template: {
        name: 'otp_verification',
        language: { code: 'en_US' },
        components: [
          { type: 'body', parameters: [{ type: 'text', text: otp }] },
          { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: otp }] },
        ],
      },
    })
    return { success: r.success, message: r.success ? `OTP template sent (msg: ${r.messageId})` : 'Template failed', error: r.error }
  })

  // Test 2: Plain text WhatsApp message
  await runTest('WhatsApp Text: OTP message', 'WHATSAPP', async () => {
    const r = await sendWhatsApp({
      messaging_product: 'whatsapp',
      to: WHATSAPP_PHONE,
      type: 'text',
      text: { preview_url: false, body: `Your NOTJUST Watr verification code is ${otp}. Valid for 5 minutes. Do not share this code.` },
    })
    return { success: r.success, message: r.success ? `OTP text sent (msg: ${r.messageId})` : 'Text message failed', error: r.error }
  })
}

async function testWhatsAppTemplates() {
  const orderNumber = 'NJW-TEST-001'

  // Test: order_confirmation template
  // Header: "Status: {{1}}" → order status
  // Body: "Your order {{1}} has been confirmed successfully." → order number
  await runTest('WhatsApp Template: order_confirmation', 'WHATSAPP', async () => {
    const r = await sendWhatsApp({
      messaging_product: 'whatsapp',
      to: WHATSAPP_PHONE,
      type: 'template',
      template: {
        name: 'order_confirmation',
        language: { code: 'en' },
        components: [
          { type: 'header', parameters: [{ type: 'text', text: 'Placed' }] },
          { type: 'body', parameters: [{ type: 'text', text: orderNumber }] },
        ],
      },
    })
    return { success: r.success, message: r.success ? `order_confirmation template sent (msg: ${r.messageId})` : 'Template failed', error: r.error }
  })

  // Test: payment_confirmation template
  // Body: "We have received your payment of ₹{{1}} for Order ID {{2}} - Notjust WATR"
  // Parameters: {{1}} = amount, {{2}} = order ID
  await runTest('WhatsApp Template: payment_confirmation', 'WHATSAPP', async () => {
    const r = await sendWhatsApp({
      messaging_product: 'whatsapp',
      to: WHATSAPP_PHONE,
      type: 'template',
      template: {
        name: 'payment_confirmation',
        language: { code: 'en' },
        components: [
          { type: 'body', parameters: [
            { type: 'text', text: '499' },
            { type: 'text', text: orderNumber },
          ] },
        ],
      },
    })
    return { success: r.success, message: r.success ? `payment_confirmation template sent (msg: ${r.messageId})` : 'Template failed', error: r.error }
  })
}

async function testWhatsAppOrderLifecycle() {
  const orderNumber = 'NJW-TEST-001'

  const messages = [
    { name: 'Order Placed', text: `🎉 Your NOTJUST Watr order #${orderNumber} has been placed! Total: ₹499. We'll notify you when it's confirmed.` },
    { name: 'Order Confirmed', text: `✅ Great news! Your NOTJUST Watr order #${orderNumber} has been confirmed and is being prepared.` },
    { name: 'Payment Received', text: `💳 Payment of ₹499 received for NOTJUST Watr order #${orderNumber}. Thank you!` },
    { name: 'Order Shipped', text: `🚚 Your NOTJUST Watr order #${orderNumber} is on its way! Track your delivery.` },
    { name: 'Order Delivered', text: `📦 Your NOTJUST Watr order #${orderNumber} has been delivered! Enjoy your wellness shots.` },
    { name: 'Order Cancelled', text: `Your NOTJUST Watr order #${orderNumber} has been cancelled. Refund will be processed if applicable.` },
    { name: 'Login Alert', text: `🔐 New login to your NOTJUST Watr account detected at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} from Chrome on Windows. If this wasn't you, please change your password immediately.` },
  ]

  for (const msg of messages) {
    await runTest(`WhatsApp Text: ${msg.name}`, 'WHATSAPP', async () => {
      const r = await sendWhatsApp({
        messaging_product: 'whatsapp',
        to: WHATSAPP_PHONE,
        type: 'text',
        text: { body: msg.text },
      })
      return { success: r.success, message: r.success ? `Sent (msg: ${r.messageId})` : 'Failed', error: r.error }
    })
  }
}

async function testEmailOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  await runTest('Email: OTP Verification', 'EMAIL', async () => {
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:16px;margin:0 0 12px;">Your verification code is:</p>
          <div style="text-align:center;margin:16px 0;">
            <span style="font-size:32px;font-weight:700;color:#48805b;letter-spacing:8px;background:#e8f0e8;padding:8px 16px;border-radius:8px;">${otp}</span>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      </div>`
    const text = `Your NOTJUST Watr verification code is: ${otp}. It expires in 5 minutes.`
    return sendEmail(EMAIL, 'Your NOTJUST Watr Verification Code', html, text)
  })
}

async function testEmailPasswordReset() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  await runTest('Email: Password Reset', 'EMAIL', async () => {
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:16px;margin:0 0 8px;">You requested to reset your password.</p>
          <div style="text-align:center;margin:16px 0;">
            <span style="font-size:32px;font-weight:700;color:#48805b;letter-spacing:8px;background:#e8f0e8;padding:8px 16px;border-radius:8px;">${otp}</span>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">This code expires in 5 minutes.</p>
        </div>
      </div>`
    const text = `Your NOTJUST Watr password reset code is: ${otp}. It expires in 5 minutes.`
    return sendEmail(EMAIL, 'Reset Your NOTJUST Watr Password', html, text)
  })
}

async function testEmailOrderLifecycle() {
  const orderNumber = 'NJW-TEST-001'

  const emailTests = [
    {
      name: 'Email: Order Placed',
      subject: `Order Placed — ${orderNumber}`,
      body: '🎉 Your order has been placed!',
      details: `Order: <strong>#${orderNumber}</strong><br>Total: <strong>₹499</strong><br>Immunity Boost Shot (x2) — ₹398<br>Energy Surge Shot (x1) — ₹199`,
      footer: "We'll notify you when your order is confirmed and being prepared.",
    },
    {
      name: 'Email: Order Confirmed',
      subject: `Order Confirmed — ${orderNumber}`,
      body: '✅ Great news! Your order is confirmed.',
      details: `Order: <strong>#${orderNumber}</strong>`,
      footer: 'Your order is being prepared and will be shipped soon.',
    },
    {
      name: 'Email: Payment Received',
      subject: `Payment Received — ${orderNumber}`,
      body: '💳 Payment received!',
      details: `Order: <strong>#${orderNumber}</strong><br>Amount: <strong>₹499</strong>`,
      footer: 'Thank you for your payment. Your order will be processed shortly.',
    },
    {
      name: 'Email: Order Shipped',
      subject: `Order Shipped — ${orderNumber}`,
      body: '🚚 Your order is on its way!',
      details: `Order: <strong>#${orderNumber}</strong>`,
      footer: 'Your wellness shots are being delivered. Track your delivery in the app.',
    },
    {
      name: 'Email: Order Delivered',
      subject: `Order Delivered — ${orderNumber}`,
      body: '📦 Your order has been delivered!',
      details: `Order: <strong>#${orderNumber}</strong>`,
      footer: 'Enjoy your wellness shots! We hope you love them.',
    },
    {
      name: 'Email: Order Cancelled',
      subject: `Order Cancelled — ${orderNumber}`,
      body: 'Your order has been cancelled',
      details: `Order: <strong>#${orderNumber}</strong>`,
      footer: 'If a refund is applicable, it will be processed within 5-7 business days.',
    },
  ]

  for (const test of emailTests) {
    await runTest(test.name, 'EMAIL', async () => {
      const html = `
        <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
            <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
          </div>
          <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
            <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">${test.body}</p>
            <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">${test.details}</p>
            <p style="color:#88837b;font-size:13px;margin:12px 0 0;">${test.footer}</p>
          </div>
          <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
        </div>`
      const text = `${test.body} — ${test.details.replace(/<[^>]+>/g, '')} — ${test.footer}`
      return sendEmail(EMAIL, test.subject, html, text)
    })
  }
}

async function testEmailLoginNotification() {
  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

  await runTest('Email: Login Notification', 'EMAIL', async () => {
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">🔐 New Login Detected</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 12px;">Hi Test User,</p>
          <div style="background:#f4f3f0;border-radius:6px;padding:12px;margin:12px 0;">
            <p style="color:#1f1e1c;font-size:13px;margin:0 0 4px;"><strong>Time:</strong> ${timeStr}</p>
            <p style="color:#1f1e1c;font-size:13px;margin:0;"><strong>Device:</strong> Chrome on Windows</p>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">If this was you, no action is needed. If you did not log in, please change your password immediately.</p>
        </div>
      </div>`
    const text = `Hi Test User, a new login to your NOTJUST Watr account was detected at ${timeStr} from Chrome on Windows. If this was not you, please change your password immediately.`
    return sendEmail(EMAIL, 'New Login to Your NOTJUST Watr Account', html, text)
  })
}

async function testSMS() {
  // SMS Alert API
  const SMS_USER = process.env.SMSALERT_USER || ''
  const SMS_PWD = process.env.SMSALERT_PWD || ''
  const SMS_SENDER = process.env.SMSALERT_SENDER || 'NJWATR'
  const SMS_ACTIVE = process.env.SMSALERT_ACTIVE || 'false'
  const SMS_BASE = 'https://www.smsalert.co.in/api'

  await runTest('SMS: Check Configuration', 'SMS', async () => {
    if (SMS_ACTIVE !== 'true') return { success: false, message: `SMSALERT_ACTIVE=${SMS_ACTIVE} (inactive)`, error: 'Set SMSALERT_ACTIVE=true to enable SMS' }
    if (!SMS_USER || !SMS_PWD) return { success: false, message: 'SMS credentials not configured', error: 'Set SMSALERT_USER and SMSALERT_PWD' }
    return { success: true, message: 'SMS is configured and active' }
  })

  await runTest('SMS: Send OTP', 'SMS', async () => {
    if (SMS_ACTIVE !== 'true' || !SMS_USER || !SMS_PWD) {
      return { success: false, message: 'SMS not configured — skipping', error: 'SMSALERT_ACTIVE must be true and credentials must be set' }
    }
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const url = new URL(`${SMS_BASE}/mverify.json`)
      url.searchParams.set('user', SMS_USER)
      url.searchParams.set('pwd', SMS_PWD)
      url.searchParams.set('sender', SMS_SENDER)
      url.searchParams.set('mobileno', PHONE)
      url.searchParams.set('otp', otp)
      url.searchParams.set('otp_length', '6')
      url.searchParams.set('template', `Your NOTJUST Watr verification code is ${otp}. Valid for 5 minutes. -NJWATR`)
      const res = await fetch(url.toString())
      const data = await res.json()
      return { success: data.status === 'success', message: `SMS API response: ${JSON.stringify(data)}` }
    } catch (err: any) {
      return { success: false, message: 'SMS API call failed', error: err.message }
    }
  })

  await runTest('SMS: Send Plain Text', 'SMS', async () => {
    if (SMS_ACTIVE !== 'true' || !SMS_USER || !SMS_PWD) {
      return { success: false, message: 'SMS not configured — skipping', error: 'SMSALERT_ACTIVE must be true and credentials must be set' }
    }
    try {
      const url = new URL(`${SMS_BASE}/push.json`)
      url.searchParams.set('user', SMS_USER)
      url.searchParams.set('pwd', SMS_PWD)
      url.searchParams.set('sender', SMS_SENDER)
      url.searchParams.set('mobileno', PHONE)
      url.searchParams.set('text', 'NOTJUST Watr: Test message from test-all-messages script. -NJWATR')
      const res = await fetch(url.toString())
      const data = await res.json()
      return { success: data.status === 'success', message: `SMS API response: ${JSON.stringify(data)}` }
    } catch (err: any) {
      return { success: false, message: 'SMS API call failed', error: err.message }
    }
  })
}

async function testPhonePe() {
  await runTest('PhonePe: Check Configuration', 'PHONEPE', async () => {
    if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
      return { success: false, message: 'PhonePe not configured', error: 'Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET' }
    }
    return { success: true, message: `PhonePe configured (env: ${PHONEPE_ENV}, base: ${PHONEPE_BASE})` }
  })

  await runTest('PhonePe: Get Access Token', 'PHONEPE', async () => {
    const token = await getPhonePeToken()
    if (!token) return { success: false, message: 'Failed to get access token', error: 'Check PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET' }
    return { success: true, message: `Token obtained (${token.substring(0, 20)}...)` }
  })

  await runTest('PhonePe: Initiate Test Payment (₹1)', 'PHONEPE', async () => {
    const token = await getPhonePeToken()
    if (!token) return { success: false, message: 'No token available', error: 'Get token failed first' }
    try {
      const res = await fetch(`${PHONEPE_BASE}/checkout/v2/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          merchantOrderId: `TEST_${Date.now()}`,
          amount: 100, // ₹1 in paise
          redirectUrl: 'https://notjustwatr.com/payment/callback',
          meta: { paymentMethods: ['UPI', 'CARD', 'NETBANKING'] },
        }),
      })
      const data = await res.json()
      if (data.success && data.redirectUrl) {
        return { success: true, message: `Payment URL: ${data.redirectUrl.substring(0, 80)}...` }
      }
      return { success: false, message: `Payment initiation failed`, error: JSON.stringify(data) }
    } catch (err: any) {
      return { success: false, message: 'PhonePe API call failed', error: err.message }
    }
  })
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  const filter = process.argv[2] || 'all'

  console.log('')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   NOTJUST Watr — Comprehensive Message Test Suite        ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`  📱 Target Phone:  ${PHONE} (WhatsApp: ${WHATSAPP_PHONE})`)
  console.log(`  📧 Target Email:  ${EMAIL}`)
  console.log(`  🔧 Filter:        ${filter}`)
  console.log('')
  console.log('  ── Config Status ──────────────────────────────────')
  console.log(`  WhatsApp:  ${WA_TOKEN ? '✅ Configured' : '❌ NOT configured'} (Phone ID: ${WA_PHONE_ID || 'N/A'})`)
  console.log(`  Zoho SMTP: ${ZOHO_EMAIL && ZOHO_PASS ? '✅ Configured' : '❌ NOT configured'} (${ZOHO_EMAIL || 'N/A'})`)
  console.log(`  SMS Alert: ${process.env.SMSALERT_ACTIVE === 'true' ? '✅ Active' : '⏸️  Inactive'} (User: ${process.env.SMSALERT_USER || 'N/A'})`)
  console.log(`  PhonePe:   ${PHONEPE_CLIENT_ID ? '✅ Configured' : '❌ NOT configured'} (Env: ${PHONEPE_ENV})`)
  console.log('')

  // ── Run tests ──
  const runAll = filter === 'all'

  if (runAll || filter === 'whatsapp') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  💬 WHATSAPP — OTP Messages')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testWhatsAppOTP()
    console.log('')
  }

  if (runAll || filter === 'templates') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  💬 WHATSAPP — Template Messages')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testWhatsAppTemplates()
    console.log('')
  }

  if (runAll || filter === 'whatsapp') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  💬 WHATSAPP — Order Lifecycle Messages')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testWhatsAppOrderLifecycle()
    console.log('')
  }

  if (runAll || filter === 'email') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  📧 EMAIL — OTP & Password Reset')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testEmailOTP()
    await testEmailPasswordReset()
    console.log('')

    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  📧 EMAIL — Order Lifecycle')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testEmailOrderLifecycle()
    console.log('')

    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  📧 EMAIL — Login Notification')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testEmailLoginNotification()
    console.log('')
  }

  if (runAll || filter === 'sms') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  📲 SMS — SMSAlert.co.in')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testSMS()
    console.log('')
  }

  if (runAll || filter === 'phonepe') {
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  💳 PhonePe — Payment Gateway')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    await testPhonePe()
    console.log('')
  }

  // ── Summary ──
  console.log('  ═══════════════════════════════════════════════════')
  console.log('  📊 SUMMARY')
  console.log('  ═══════════════════════════════════════════════════')
  console.log(`  Total:  ${results.length}`)
  console.log(`  Passed: ${passCount} ✅`)
  console.log(`  Failed: ${failCount} ❌`)
  console.log(`  Time:   ${results.reduce((s, r) => s + r.duration_ms, 0)}ms`)
  console.log('')

  // Group by channel
  const channels = [...new Set(results.map(r => r.channel))]
  for (const ch of channels) {
    const chResults = results.filter(r => r.channel === ch)
    const chPass = chResults.filter(r => r.success).length
    const chFail = chResults.filter(r => !r.success).length
    console.log(`  ${ch}: ${chPass}/${chResults.length} passed${chFail > 0 ? ` (${chFail} FAILED)` : ''}`)
  }

  // Show failed tests detail
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('')
    console.log('  ┌──────────────────────────────────────────────────┐')
    console.log('  │ ❌ FAILED TESTS — Detailed Errors               │')
    console.log('  └──────────────────────────────────────────────────┘')
    for (const f of failed) {
      console.log('')
      console.log(`  Test:    ${f.name}`)
      console.log(`  Channel: ${f.channel}`)
      console.log(`  Message: ${f.message}`)
      if (f.error) console.log(`  Error:   ${f.error}`)
    }
  }

  console.log('')
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
