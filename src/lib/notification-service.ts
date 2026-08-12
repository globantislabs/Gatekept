// NOTJUST Watr — Notification Service
// Backend-only module for sending order lifecycle notifications
// Combines email (Zoho SMTP), WhatsApp (Business API), and SMS (SMSAlert)
// NEVER import this in client-side code

import { db } from '@/lib/db'
import { emailService } from '@/lib/email-service'
import { smsAlertService } from '@/lib/smsalert-service'

// ─── WhatsApp Config ─────────────────────────────────────────
// Lazy env var reading — these are read at CALL TIME, not import time,
// so they work correctly when the server loads .env.production at startup.
function getWhatsappToken() { return process.env.WHATSAPP_TOKEN || '' }
function getWhatsappPhoneNumberId() { return process.env.WHATSAPP_PHONE_NUMBER_ID || '' }
const WHATSAPP_API_VERSION = 'v19.0'
function getWhatsappBaseUrl() {
  const phoneId = getWhatsappPhoneNumberId()
  return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneId}/messages`
}

// ─── SMS Config ──────────────────────────────────────────────
function getSmsAlertActive() { return process.env.SMSALERT_ACTIVE || '' }

// ─── Types ────────────────────────────────────────────────────

type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PASSWORD_RESET'
  | 'LOGIN'

type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS'

interface OrderInfo {
  id: string
  order_number: string
  status: string
  total_amount: number
  items?: { product_name: string; quantity: number; total_price: number }[]
}

interface UserInfo {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

// ─── Format Indian phone for WhatsApp ──────────────────────
function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  }
  if (cleaned.length !== 10) {
    return phone.replace(/\D/g, '') // Return whatever we have
  }
  return `91${cleaned}`
}

// ─── Format items for display ─────────────────────────────────
function formatItemsForDisplay(items?: { product_name: string; quantity: number; total_price: number }[]): string {
  if (!items || items.length === 0) return 'No items'
  return items.map(item => `${item.product_name} (x${item.quantity}) — ₹${item.total_price}`).join('<br>')
}

// ─── WhatsApp Template Message Sender ──────────────────────────
// IMPORTANT: Template messages work OUTSIDE the 24-hour customer window.
// Free-form text messages only work INSIDE the 24-hour window.
// So we ALWAYS try template first, then fall back to text.
async function sendWhatsAppTemplateMessage(
  phone: string,
  templateName: string,
  bodyParameters: string[],
  headerParameters?: string[],
  languageCode: string = 'en_US'
): Promise<boolean> {
  const token = getWhatsappToken()
  const phoneId = getWhatsappPhoneNumberId()
  if (!token || !phoneId) {
    console.log(`[WhatsApp] Credentials not configured — template "${templateName}" not sent to:`, phone)
    return false
  }

  try {
    const whatsappPhone = formatPhoneForWhatsApp(phone)
    const baseUrl = getWhatsappBaseUrl()

    // Build components array
    const components: { type: string; parameters: { type: string; text: string }[] }[] = []

    // Header component (if template has header variables)
    if (headerParameters && headerParameters.length > 0) {
      components.push({
        type: 'header',
        parameters: headerParameters.map(p => ({ type: 'text', text: p })),
      })
    }

    // Body component
    components.push({
      type: 'body',
      parameters: bodyParameters.map(p => ({ type: 'text', text: p })),
    })

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error(`[WhatsApp] Template "${templateName}" error:`, JSON.stringify(data.error))
      return false
    }

    console.log(`[WhatsApp] Template "${templateName}" sent to ${whatsappPhone}`)
    return true
  } catch (error: any) {
    console.error(`[WhatsApp] Template "${templateName}" error:`, error.message)
    return false
  }
}

// ─── WhatsApp Text Message Sender (fallback only) ────────────
// NOTE: This only works within 24 hours of user's last message to the business.
// For messages outside that window, template messages MUST be used.
async function sendWhatsAppTextMessage(phone: string, text: string): Promise<boolean> {
  const token = getWhatsappToken()
  const phoneId = getWhatsappPhoneNumberId()
  if (!token || !phoneId) {
    console.log('[WhatsApp] Credentials not configured — message not sent to:', phone)
    return false
  }

  try {
    const whatsappPhone = formatPhoneForWhatsApp(phone)
    const baseUrl = getWhatsappBaseUrl()
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappPhone,
        type: 'text',
        text: { body: text },
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('[WhatsApp] Text message error:', data.error.message)
      return false
    }

    console.log(`[WhatsApp] Text message sent to ${whatsappPhone}`)
    return true
  } catch (error: any) {
    console.error('[WhatsApp] Text message error:', error.message)
    return false
  }
}

// ─── Unified WhatsApp sender: template first, text fallback ───
// Tries the template message first (works outside 24hr window).
// If template fails, falls back to plain text (works inside 24hr window only).
async function sendWhatsApp(
  phone: string,
  templateName: string,
  bodyParameters: string[],
  fallbackText: string,
  headerParameters?: string[],
  languageCode: string = 'en_US'
): Promise<boolean> {
  // Try template first (works outside 24hr window)
  const templateSuccess = await sendWhatsAppTemplateMessage(phone, templateName, bodyParameters, headerParameters, languageCode)
  if (templateSuccess) return true

  // Fallback: plain text (only works inside 24hr window)
  console.log(`[WhatsApp] Template "${templateName}" failed — falling back to plain text (may not deliver outside 24hr window)`)
  return sendWhatsAppTextMessage(phone, fallbackText)
}

// ─── Log notification to database ──────────────────────────────
async function logNotification(
  userId: string | null,
  orderId: string | null,
  type: NotificationType,
  channel: NotificationChannel,
  status: string,
  recipient: string,
  subject?: string,
  content?: string,
  errorMessage?: string
): Promise<void> {
  try {
    if (!db?.notificationLog) {
      console.warn('NotificationLog model not available — skipping notification log')
      return
    }
    await db.notificationLog.create({
      data: {
        user_id: userId,
        order_id: orderId,
        type,
        channel,
        status,
        recipient,
        subject,
        content: content ? content.substring(0, 500) : null, // Limit content length
        error_message: errorMessage ? errorMessage.substring(0, 500) : null,
        sent_at: status === 'SENT' ? new Date() : null,
      },
    })
  } catch (err) {
    console.error('Failed to log notification:', err)
  }
}

// ─── Public Service ────────────────────────────────────────────

export const notificationService = {
  /**
   * Send order placed notification via email, WhatsApp, and SMS
   */
  async sendOrderPlacedNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const itemsDisplay = formatItemsForDisplay(order.items)
    const whatsappText = `🎉 Your NOTJUST Watr order #${order.order_number} has been placed! Total: ₹${order.total_amount}. We'll notify you when it's confirmed.`
    const smsText = `NOTJUST Watr: Order #${order.order_number} placed! Total: ₹${order.total_amount}. We'll notify you when confirmed. -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendOrderPlacedEmail(user.email, {
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          items: itemsDisplay,
        })
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Order Placed — ${order.order_number}`, `Order #${order.order_number} placed, Total: ₹${order.total_amount}`, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order placed email:', err.message)
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        // Template: order_confirmation
        // Body: "{{1}}" = order_number, "{{2}}" = status (2 body params)
        const success = await sendWhatsApp(
          user.phone,
          'order_confirmation',
          [order.order_number, order.status || 'Placed'],  // body: [order_number, status]
          whatsappText,                      // fallback plain text
          undefined,                         // no header component
          'en_US'                             // language: en_US (as configured in Meta)
        )
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send order placed WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order placed SMS:', err.message)
        await logNotification(user.id, order.id, 'ORDER_PLACED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send order confirmed notification
   */
  async sendOrderConfirmedNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const whatsappText = `✅ Great news! Your NOTJUST Watr order #${order.order_number} has been confirmed and is being prepared.`
    const smsText = `NOTJUST Watr: Order #${order.order_number} confirmed! Being prepared now. -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendOrderConfirmedEmail(user.email, { orderNumber: order.order_number })
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Order Confirmed — ${order.order_number}`, undefined, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order confirmed email:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        const success = await sendWhatsApp(
          user.phone,
          'order_confirmation',
          [order.order_number, 'Confirmed'],    // body: [order_number, status]
          whatsappText,                      // fallback plain text
          undefined,                         // no header component
          'en_US'
        )
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send order confirmed WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order confirmed SMS:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CONFIRMED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send payment received notification
   */
  async sendPaymentReceivedNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const whatsappText = `💳 Payment of ₹${order.total_amount} received for NOTJUST Watr order #${order.order_number}. Thank you!`
    const smsText = `NOTJUST Watr: Payment ₹${order.total_amount} received for order #${order.order_number}. Thank you! -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendPaymentReceivedEmail(user.email, { orderNumber: order.order_number, totalAmount: order.total_amount })
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Payment Received — ${order.order_number}`, undefined, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send payment received email:', err.message)
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        // Template: payment_confirmation
        // Body: "We have received your payment of ₹{{1}} for Order ID {{2}} - Notjust WATR"
        const success = await sendWhatsApp(
          user.phone,
          'payment_confirmation',
          [`${order.total_amount}`, order.order_number],  // body: amount, order ID
          whatsappText,                                    // fallback plain text
          undefined,                                       // no header
          'en_US'
        )
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send payment received WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send payment received SMS:', err.message)
        await logNotification(user.id, order.id, 'PAYMENT_RECEIVED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send order shipped notification
   */
  async sendOrderShippedNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const whatsappText = `🚚 Your NOTJUST Watr order #${order.order_number} is on its way! Track your delivery.`
    const smsText = `NOTJUST Watr: Order #${order.order_number} shipped! Track delivery in app. -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendOrderShippedEmail(user.email, { orderNumber: order.order_number })
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Order Shipped — ${order.order_number}`, undefined, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order shipped email:', err.message)
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        const success = await sendWhatsApp(
          user.phone,
          'order_confirmation',
          [order.order_number, 'Shipped'],       // body: [order_number, status]
          whatsappText,                      // fallback plain text
          undefined,                         // no header component
          'en_US'
        )
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send order shipped WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order shipped SMS:', err.message)
        await logNotification(user.id, order.id, 'ORDER_SHIPPED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send order delivered notification
   */
  async sendOrderDeliveredNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const whatsappText = `📦 Your NOTJUST Watr order #${order.order_number} has been delivered! Enjoy your wellness shots.`
    const smsText = `NOTJUST Watr: Order #${order.order_number} delivered! Enjoy your wellness shots. -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendOrderDeliveredEmail(user.email, { orderNumber: order.order_number })
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Order Delivered — ${order.order_number}`, undefined, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order delivered email:', err.message)
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        const success = await sendWhatsApp(
          user.phone,
          'order_confirmation',
          [order.order_number, 'Delivered'],     // body: [order_number, status]
          whatsappText,                      // fallback plain text
          undefined,                         // no header component
          'en_US'
        )
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send order delivered WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order delivered SMS:', err.message)
        await logNotification(user.id, order.id, 'ORDER_DELIVERED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send order cancelled notification
   */
  async sendOrderCancelledNotification(order: OrderInfo, user: UserInfo): Promise<void> {
    const whatsappText = `Your NOTJUST Watr order #${order.order_number} has been cancelled. Refund will be processed if applicable.`
    const smsText = `NOTJUST Watr: Order #${order.order_number} cancelled. Refund in 5-7 days if applicable. -NJWATR`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendOrderCancelledEmail(user.email, { orderNumber: order.order_number })
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, `Order Cancelled — ${order.order_number}`, undefined, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order cancelled email:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        const success = await sendWhatsApp(
          user.phone,
          'order_confirmation',
          [order.order_number, 'Cancelled'],     // body: [order_number, status]
          whatsappText,                      // fallback plain text
          undefined,                         // no header component
          'en_US'
        )
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone || '', undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send order cancelled WhatsApp:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'WHATSAPP', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }

    // SMS
    if (user.phone && getSmsAlertActive() === 'true') {
      try {
        const result = await smsAlertService.sendSms(user.phone, smsText)
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'SMS', result.success ? 'SENT' : 'FAILED', user.phone || '', undefined, smsText, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send order cancelled SMS:', err.message)
        await logNotification(user.id, order.id, 'ORDER_CANCELLED', 'SMS', 'FAILED', user.phone || '', undefined, undefined, err.message)
      }
    }
  },

  /**
   * Send login notification (security alert)
   */
  async sendLoginNotification(user: UserInfo, device?: string): Promise<void> {
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    const whatsappText = `🔐 New login to your NOTJUST Watr account detected at ${timeStr}${device ? ` from ${device}` : ''}. If this wasn't you, please change your password immediately.`

    // Email
    if (user.email) {
      try {
        const result = await emailService.sendLoginNotificationEmail(user.email, {
          name: user.name,
          device: device || 'Web Browser',
          time: timeStr,
        })
        await logNotification(user.id, null, 'LOGIN', 'EMAIL', result.success ? 'SENT' : 'FAILED', user.email, 'New Login Detected', `Login at ${timeStr}`, result.success ? undefined : result.message)
      } catch (err: any) {
        console.error('Failed to send login notification email:', err.message)
        await logNotification(user.id, null, 'LOGIN', 'EMAIL', 'FAILED', user.email, undefined, undefined, err.message)
      }
    }

    // WhatsApp — template first, text fallback
    if (user.phone) {
      try {
        // Use otp_verification template as a workaround for login alerts
        // (it's the only approved template that works outside 24hr window)
        const success = await sendWhatsApp(
          user.phone,
          'otp_verification',
          ['Login Alert'],                   // body: alert type
          whatsappText,                      // fallback plain text
          undefined,                         // no header
          'en_US'                            // language: en_US (as configured in Meta)
        )
        await logNotification(user.id, null, 'LOGIN', 'WHATSAPP', success ? 'SENT' : 'FAILED', user.phone, undefined, whatsappText, success ? undefined : 'WhatsApp delivery failed or not configured')
      } catch (err: any) {
        console.error('Failed to send login notification WhatsApp:', err.message)
        await logNotification(user.id, null, 'LOGIN', 'WHATSAPP', 'FAILED', user.phone, undefined, undefined, err.message)
      }
    }
  },
}
