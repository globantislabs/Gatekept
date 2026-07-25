// NOTJUST Watr — Zoho Email Service
// Backend-only module for sending emails via Zoho SMTP
// NEVER import this in client-side code

// ─── Config ──────────────────────────────────────────────────
const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com'
const ZOHO_SMTP_PORT = parseInt(process.env.ZOHO_SMTP_PORT || '465')
const ZOHO_EMAIL = process.env.ZOHO_EMAIL || ''
const ZOHO_PASSWORD = process.env.ZOHO_PASSWORD || ''

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
    console.warn('nodemailer not installed — email service will log to console only')
    return null
  }
}

// ─── Create transporter ──────────────────────────────────────
let transporter: import('nodemailer').Transporter | null = null

async function getTransporter(): Promise<import('nodemailer').Transporter | null> {
  const nm = await loadNodemailer()
  if (!nm) return null
  if (!ZOHO_EMAIL || !ZOHO_PASSWORD) return null

  if (!transporter) {
    transporter = nm.createTransport({
      host: ZOHO_SMTP_HOST,
      port: ZOHO_SMTP_PORT,
      secure: true, // SSL for port 465
      auth: {
        user: ZOHO_EMAIL,
        pass: ZOHO_PASSWORD,
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
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return Boolean(ZOHO_EMAIL && ZOHO_PASSWORD)
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
    // Dev mode — log to console
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`)
    console.log(`[DEV EMAIL] Body: ${text}`)
    return {
      success: true,
      message: 'Email logged to console (dev mode — no SMTP configured)',
    }
  }

  try {
    const result = await tp.sendMail({
      from: `"NOTJUST Watr" <${ZOHO_EMAIL}>`,
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
