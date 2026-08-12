// NOTJUST Watr — PhonePe Payment Gateway Service
// Backend-only module for PhonePe PG v2 (sandbox + production)
// NEVER import this in client-side code

// ─── Config ──────────────────────────────────────────────────
function getRawClientId() { return process.env.PHONEPE_CLIENT_ID || '' }
function getClientSecret() { return process.env.PHONEPE_CLIENT_SECRET || '' }
function getClientVersion() { return process.env.PHONEPE_CLIENT_VERSION || '' }
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
  meta?: Record<string, string>
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
  const rawClientId = getRawClientId()
  const clientSecret = getClientSecret()
  const configuredVersion = getClientVersion()
  const inferredVersion = !configuredVersion && rawClientId.includes('_')
    ? rawClientId.split('_').pop() || ''
    : ''
  const clientVersion = configuredVersion || inferredVersion
  const clientId = rawClientId

  if (!clientId || !clientSecret || !clientVersion) {
    console.error('[PhonePe] Client ID, Secret, or Version not configured')
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }

  try {
    const baseUrl = getBaseUrl()
    console.log(`[PhonePe] Requesting token from ${baseUrl}/v1/oauth/token (env: ${getPhonePeEnv()})`)
    const body = new URLSearchParams({
      client_id: clientId,
      client_version: clientVersion,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })
    const response = await fetch(`${baseUrl}/v1/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const data = await response.json()
    const accessToken = data.access_token || data.accessToken
    const expiresIn = data.expires_in || data.expiresIn
    const expiresAt = data.expires_at || data.expiresAt

    if (accessToken) {
      cachedToken = accessToken
      tokenExpiry = expiresAt ? Number(expiresAt) * 1000 : Date.now() + (expiresIn || 3600) * 1000
      console.log(`[PhonePe] Token acquired, expires in ${expiresIn || 'configured'}s`)
      return cachedToken
    }

    // Handle common PhonePe errors
    const errMsg = data.message || data.error || 'Unknown error'
    console.error('[PhonePe] Token error:', errMsg)
    if (errMsg.includes('Api Mapping Not Found')) {
      console.error('[PhonePe] API endpoint not found — ensure the PhonePe integration is activated and your server IP is whitelisted on the PhonePe dashboard')
    }
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
    const rawClientId = getRawClientId()
    return Boolean(rawClientId && getClientSecret() && (getClientVersion() || rawClientId.includes('_')))
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
          'Authorization': `O-Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantOrderId: request.merchantOrderId,
          amount: Math.round(request.amount * 100), // Convert to paise
          expireAfter: 1200,
          metaInfo: request.meta || {},
          paymentFlow: {
            type: 'PG_CHECKOUT',
            message: 'Complete your NOTJUST Watr payment',
            merchantUrls: {
              redirectUrl: request.redirectUrl,
            },
          },
        }),
      })

      const data = await response.json()

      const redirectUrl =
        data.redirectUrl ||
        data.tokenUrl ||
        data.data?.redirectUrl ||
        data.data?.tokenUrl ||
        data.data?.instrumentResponse?.redirectInfo?.url

      if ((data.success || redirectUrl) && redirectUrl) {
        return {
          success: true,
          orderId: request.merchantOrderId,
          paymentUrl: redirectUrl,
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
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success || data.state || data.status) {
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
      const merchantRefundId = `refund_${merchantOrderId}_${Date.now()}`
      const response = await fetch(`${baseUrl}/payments/v2/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantRefundId,
          originalMerchantOrderId: merchantOrderId,
          amount: Math.round(amount * 100), // Convert to paise
          metaInfo: {
            udf1: reason || 'Order cancelled by customer',
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        return {
          success: true,
          refundId: merchantRefundId,
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
