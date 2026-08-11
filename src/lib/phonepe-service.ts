// NOTJUST Watr — PhonePe Payment Gateway Service
// Backend-only module for PhonePe PG v2 (sandbox + production)
// NEVER import this in client-side code

// ─── Config ──────────────────────────────────────────────────
function getClientId() { return process.env.PHONEPE_CLIENT_ID || '' }
function getClientSecret() { return process.env.PHONEPE_CLIENT_SECRET || '' }
function getPhonePeEnv() { return process.env.PHONEPE_ENV || 'sandbox' }

const SANDBOX_BASE_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const PRODUCTION_BASE_URL = 'https://api.phonepe.com/apis/pg'

function getBaseUrl(): string {
  return getPhonePeEnv() === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL
}

// ─── Types ────────────────────────────────────────────────────
export interface PhonePePaymentRequest {
  merchantOrderId: string
  amount: number // in INR (will be converted to paise)
  redirectUrl: string
  meta?: {
    paymentMethods?: string[] // e.g., ['UPI', 'CARD', 'NETBANKING']
  }
}

export interface PhonePePaymentResponse {
  success: boolean
  orderId: string
  paymentUrl?: string
  message?: string
  error?: string
}

export interface PhonePeStatusResponse {
  success: boolean
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED' | string
  paymentDetails?: {
    paymentMethod?: string
    upiId?: string
    cardLast4?: string
    bankName?: string
  }
  message?: string
}

export interface PhonePeRefundResponse {
  success: boolean
  refundId?: string
  message?: string
  error?: string
}

// ─── Token Cache ─────────────────────────────────────────────
let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken(): Promise<string | null> {
  const clientId = getClientId()
  const clientSecret = getClientSecret()

  if (!clientId || !clientSecret) {
    console.error('[PhonePe] Client ID or Secret not configured')
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }

  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/v2/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    const data = await response.json()

    if (data.accessToken) {
      cachedToken = data.accessToken
      tokenExpiry = Date.now() + (data.expiresIn || 3600) * 1000
      return cachedToken
    }

    console.error('[PhonePe] Token error:', data.message || data.error || 'Unknown error')
    return null
  } catch (error: any) {
    console.error('[PhonePe] Token fetch error:', error.message)
    return null
  }
}

// ─── Public Service ────────────────────────────────────────────

export const phonePeService = {
  /**
   * Check if PhonePe is configured
   */
  isConfigured(): boolean {
    return Boolean(getClientId() && getClientSecret())
  },

  /**
   * Initiate a payment
   */
  async initiatePayment(request: PhonePePaymentRequest): Promise<PhonePePaymentResponse> {
    const token = await getAccessToken()
    if (!token) {
      return { success: false, orderId: request.merchantOrderId, error: 'PhonePe not configured or token fetch failed' }
    }

    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/checkout/v2/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantOrderId: request.merchantOrderId,
          amount: Math.round(request.amount * 100), // Convert to paise
          redirectUrl: request.redirectUrl,
          meta: request.meta || {
            paymentMethods: ['UPI', 'CARD', 'NETBANKING', 'WALLET'],
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.redirectUrl) {
        return {
          success: true,
          orderId: request.merchantOrderId,
          paymentUrl: data.redirectUrl,
          message: 'Payment initiated successfully',
        }
      }

      return {
        success: false,
        orderId: request.merchantOrderId,
        error: data.message || data.error || 'Payment initiation failed',
      }
    } catch (error: any) {
      console.error('[PhonePe] Payment initiation error:', error.message)
      return {
        success: false,
        orderId: request.merchantOrderId,
        error: error.message,
      }
    }
  },

  /**
   * Check payment status
   */
  async checkStatus(merchantOrderId: string): Promise<PhonePeStatusResponse> {
    const token = await getAccessToken()
    if (!token) {
      return { success: false, status: 'PENDING', message: 'PhonePe not configured' }
    }

    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/checkout/v2/order/${merchantOrderId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          status: data.state || data.status || 'PENDING',
          paymentDetails: data.paymentDetails,
        }
      }

      return {
        success: false,
        status: data.state || 'PENDING',
        message: data.message || 'Status check failed',
      }
    } catch (error: any) {
      console.error('[PhonePe] Status check error:', error.message)
      return { success: false, status: 'PENDING', message: error.message }
    }
  },

  /**
   * Refund a payment
   */
  async refund(merchantOrderId: string, amount: number, reason?: string): Promise<PhonePeRefundResponse> {
    const token = await getAccessToken()
    if (!token) {
      return { success: false, message: 'PhonePe not configured' }
    }

    try {
      const baseUrl = getBaseUrl()
      const uniqueRefundId = `refund_${merchantOrderId}_${Date.now()}`
      const response = await fetch(`${baseUrl}/checkout/v2/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantOrderId,
          uniqueRefundId,
          amount: Math.round(amount * 100), // Convert to paise
          reason: reason || 'Order cancelled by customer',
        }),
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          refundId: uniqueRefundId,
          message: 'Refund initiated successfully',
        }
      }

      return {
        success: false,
        message: data.message || data.error || 'Refund failed',
      }
    } catch (error: any) {
      console.error('[PhonePe] Refund error:', error.message)
      return { success: false, message: error.message }
    }
  },
}
