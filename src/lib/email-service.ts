// NOTJUST Watr — Zoho Email Service
// Backend-only module for sending emails via Zoho SMTP
// NEVER import this in client-side code

// ─── Config (read lazily from process.env at call time) ────────
// This ensures env vars are available even if dotenv loads them after
// the module is first imported (e.g., when running via tsx/npx)
function getZohoHost() { return process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com' }
function getZohoPort() { return parseInt(process.env.ZOHO_SMTP_PORT || '465') }
function getZohoEmail() { return process.env.ZOHO_EMAIL || '' }
function getZohoPassword() { return process.env.ZOHO_PASSWORD || '' }

// ─── Types ───────────────────────────────────────────────────
interface EmailResult {
  success: boolean
  message: string
  messageId?: string
}

// ─── Dynamic nodemailer loader ──────────────────────────────
// nodemailer is a server-only package; we load it lazily to avoid
// bundling issues and satisfy the no-require-imports lint rule.
let nodemailerModule: typeof import('nodemailer') | null = null

async function loadNodemailer(): Promise<typeof import('nodemailer') | null> {
  if (nodemailerModule) return nodemailerModule
  try {
    nodemailerModule = await import('nodemailer')
    return nodemailerModule
  } catch {
    console.error('nodemailer not installed — email service cannot send emails')
    return null
  }
}

// ─── Create transporter ──────────────────────────────────────
let transporter: import('nodemailer').Transporter | null = null

async function getTransporter(): Promise<import('nodemailer').Transporter | null> {
  const nm = await loadNodemailer()
  if (!nm) return null

  const email = getZohoEmail()
  const password = getZohoPassword()
  if (!email || !password) return null

  // Recreate transporter if credentials changed (e.g., env vars loaded after first call)
  if (!transporter || transporter.options.auth?.user !== email) {
    transporter = nm.createTransport({
      host: getZohoHost(),
      port: getZohoPort(),
      secure: true, // SSL for port 465
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certs in dev
      },
    })
  }
  return transporter
}

// ─── Public Service ──────────────────────────────────────────

export const emailService = {
  /**
   * Send an OTP code email to a user
   * Uses a professional HTML template with branding
   */
  async sendOtpEmail(to: string, otpCode: string): Promise<EmailResult> {
    const subject = 'Your NOTJUST Watr Verification Code'
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:16px;margin:0 0 12px;">Your verification code is:</p>
          <div style="text-align:center;margin:16px 0;">
            <span style="font-size:32px;font-weight:700;color:#48805b;letter-spacing:8px;background:#e8f0e8;padding:8px 16px;border-radius:8px;">${otpCode}</span>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">This code expires in 5 minutes. Do not share it with anyone.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">If you did not request this, please ignore this email.</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr verification code is: ${otpCode}. It expires in 5 minutes. Do not share this code.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send a general notification email
   * Useful for order confirmations, delivery updates, etc.
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<EmailResult> {
    // Wrap plain text body in a simple HTML template
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:15px;line-height:1.6;">${body}</p>
        </div>
      </div>
    `

    return sendEmail(to, subject, htmlBody, body)
  },

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetEmail(to: string, otpCode: string): Promise<EmailResult> {
    const subject = 'Reset Your NOTJUST Watr Password'
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:16px;margin:0 0 8px;">You requested to reset your password.</p>
          <p style="color:#88837b;font-size:13px;margin:0 0 12px;">Enter this verification code to proceed:</p>
          <div style="text-align:center;margin:16px 0;">
            <span style="font-size:32px;font-weight:700;color:#48805b;letter-spacing:8px;background:#e8f0e8;padding:8px 16px;border-radius:8px;">${otpCode}</span>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">This code expires in 5 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">NOTJUST Watr — Wellness Shots for a Better You</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr password reset code is: ${otpCode}. It expires in 5 minutes. If you did not request this, please ignore this email.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send order placed email
   */
  async sendOrderPlacedEmail(to: string, orderDetails: { orderNumber: string; totalAmount: number; items: string }): Promise<EmailResult> {
    const subject = `Order Placed — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">🎉 Your order has been placed!</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Total: <strong>₹${orderDetails.totalAmount}</strong></p>
          <div style="background:#f4f3f0;border-radius:6px;padding:12px;margin:12px 0;">
            <p style="color:#1f1e1c;font-size:13px;margin:0;">${orderDetails.items}</p>
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">We'll notify you when your order is confirmed and being prepared.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr order #${orderDetails.orderNumber} has been placed! Total: ₹${orderDetails.totalAmount}. We'll notify you when it's confirmed.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send order confirmed email
   */
  async sendOrderConfirmedEmail(to: string, orderDetails: { orderNumber: string }): Promise<EmailResult> {
    const subject = `Order Confirmed — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">✅ Great news! Your order is confirmed.</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">Your order is being prepared and will be shipped soon. We'll send you another update when it's on its way.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
      </div>
    `
    const textBody = `Great news! Your NOTJUST Watr order #${orderDetails.orderNumber} has been confirmed and is being prepared.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send payment received email
   */
  async sendPaymentReceivedEmail(to: string, orderDetails: { orderNumber: string; totalAmount: number }): Promise<EmailResult> {
    const subject = `Payment Received — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">💳 Payment received!</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Amount: <strong>₹${orderDetails.totalAmount}</strong></p>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">Thank you for your payment. Your order will be processed shortly.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
      </div>
    `
    const textBody = `Payment of ₹${orderDetails.totalAmount} received for NOTJUST Watr order #${orderDetails.orderNumber}. Thank you!`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send order shipped email
   */
  async sendOrderShippedEmail(to: string, orderDetails: { orderNumber: string }): Promise<EmailResult> {
    const subject = `Order Shipped — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">🚚 Your order is on its way!</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">Your wellness shots are being delivered. Track your delivery in the app.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr order #${orderDetails.orderNumber} is on its way! Track your delivery in the app.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send order delivered email
   */
  async sendOrderDeliveredEmail(to: string, orderDetails: { orderNumber: string }): Promise<EmailResult> {
    const subject = `Order Delivered — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">📦 Your order has been delivered!</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">Enjoy your wellness shots! We hope you love them.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">Thank you for choosing NOTJUST Watr</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr order #${orderDetails.orderNumber} has been delivered! Enjoy your wellness shots.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send order cancelled email
   */
  async sendOrderCancelledEmail(to: string, orderDetails: { orderNumber: string }): Promise<EmailResult> {
    const subject = `Order Cancelled — ${orderDetails.orderNumber}`
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#1f1e1c;font-size:18px;font-weight:700;margin:0 0 12px;">Your order has been cancelled</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Order: <strong>#${orderDetails.orderNumber}</strong></p>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">If a refund is applicable, it will be processed within 5-7 business days.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">We hope to serve you again — NOTJUST Watr</p>
      </div>
    `
    const textBody = `Your NOTJUST Watr order #${orderDetails.orderNumber} has been cancelled. Refund will be processed if applicable.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Send login notification email (security alert)
   */
  async sendLoginNotificationEmail(to: string, details: { name: string; device?: string; time: string }): Promise<EmailResult> {
    const subject = 'New Login to Your NOTJUST Watr Account'
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#f4f3f0;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#48805b;font-size:24px;font-weight:700;margin:0;">NOTJUST Watr</h1>
          <p style="color:#88837b;font-size:14px;margin:4px 0 0;">Wellness, Verified.</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e3dfd8;">
          <p style="color:#48805b;font-size:18px;font-weight:700;margin:0 0 12px;">🔐 New Login Detected</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 8px;">Hi ${details.name},</p>
          <p style="color:#1f1e1c;font-size:15px;margin:0 0 12px;">A new login to your NOTJUST Watr account was detected:</p>
          <div style="background:#f4f3f0;border-radius:6px;padding:12px;margin:12px 0;">
            <p style="color:#1f1e1c;font-size:13px;margin:0 0 4px;"><strong>Time:</strong> ${details.time}</p>
            ${details.device ? `<p style="color:#1f1e1c;font-size:13px;margin:0;"><strong>Device:</strong> ${details.device}</p>` : ''}
          </div>
          <p style="color:#88837b;font-size:13px;margin:12px 0 0;">If this was you, no action is needed. If you did not log in, please change your password immediately.</p>
        </div>
        <p style="color:#88837b;font-size:11px;text-align:center;margin-top:16px;">NOTJUST Watr — Wellness Shots for a Better You</p>
      </div>
    `
    const textBody = `Hi ${details.name}, a new login to your NOTJUST Watr account was detected at ${details.time}${details.device ? ` from ${details.device}` : ''}. If this was not you, please change your password immediately.`

    return sendEmail(to, subject, htmlBody, textBody)
  },

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return Boolean(getZohoEmail() && getZohoPassword())
  },
}

// ─── Internal: send email ────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailResult> {
  const tp = await getTransporter()

  if (!tp) {
    // Zoho SMTP not configured — return error, do NOT silently log to console
    console.error(`[EMAIL FAILED] Zoho SMTP not configured. Set ZOHO_EMAIL and ZOHO_PASSWORD in .env. Attempted to send to: ${to}`)
    return {
      success: false,
      message: 'Email service not configured. Set ZOHO_EMAIL and ZOHO_PASSWORD environment variables.',
    }
  }

  try {
    const result = await tp.sendMail({
      from: `"NOTJUST Watr" <${getZohoEmail()}>`,
      to,
      subject,
      html,
      text,
    })

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('Zoho SMTP error:', error.message)
    return {
      success: false,
      message: `Email delivery failed: ${error.message}`,
    }
  }
}
