// Unified Data Service Layer
// Abstracts over mock Supabase and real Supabase
// When real Supabase tables don't exist yet, gracefully falls back to mock data
// All data operations go through this module

import { getMockStore, shouldUseMockSupabase } from './mock-supabase'
import type { UserProfile, Campaign, QrScan, LearningProgress, QuizQuestion, Product, Order, OrderItem, GuaranteePlan, ProductVideo, Subscription } from './mock-supabase'
import { isSupabaseConfigured, supabase, testSupabaseConnection } from './supabase-client'

// Re-export types
export type { UserProfile, Campaign, QrScan, LearningProgress, QuizQuestion, Product, Order, OrderItem, GuaranteePlan, ProductVideo, Subscription }

// Whether to use real Supabase (only if configured AND tables exist)
let _useReal = false

export async function initDataService(): Promise<boolean> {
  if (shouldUseMockSupabase()) {
    _useReal = false
    return false
  }
  const connected = await testSupabaseConnection()
  _useReal = connected
  return connected
}

export function isUsingRealSupabase(): boolean {
  return _useReal
}

// Helper: try real Supabase, fall back to mock on error
async function tryRealOrMock<T>(realFn: () => Promise<T>, mockFn: () => T): Promise<T> {
  if (!_useReal) return mockFn()
  try {
    return await realFn()
  } catch (err) {
    console.warn('[DataService] Real Supabase query failed, falling back to mock:', err)
    return mockFn()
  }
}

// ============================================================
// AUTH SERVICE
// ============================================================
export const authService = {
  async loginWithPhone(phone: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.auth.signInWithOtp({ phone })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        let user = store.findOne<UserProfile>('users_profile', { phone } as any)
        // Demo: auto-create user if not found
        if (!user) {
          const id = 'usr_' + Date.now()
          user = store.insert('users_profile', {
            id,
            user_id: id,
            name: 'Demo User',
            phone,
            country: 'India',
            learning_completed: false,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) as UserProfile
          // Create learning_progress record for new user
          store.insert('learning_progress', {
            user_id: id,
            video_progress: {},
            quiz_completed: false,
            quiz_score: 0,
            created_at: new Date().toISOString(),
          })
        }
        return { data: { user, demoOtp: '123456' }, error: null }
      }
    )
  },

  async loginWithEmail(email: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.auth.signInWithOtp({ email })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        let user = store.findOne<UserProfile>('users_profile', { email } as any)
        // Demo: auto-create user if not found
        if (!user) {
          const id = 'usr_' + Date.now()
          user = store.insert('users_profile', {
            id,
            user_id: id,
            name: email.split('@')[0],
            email,
            country: 'India',
            learning_completed: false,
            is_admin: email === 'admin@notjust.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) as UserProfile
          // Create learning_progress record for new user
          store.insert('learning_progress', {
            user_id: id,
            video_progress: {},
            quiz_completed: false,
            quiz_score: 0,
            created_at: new Date().toISOString(),
          })
        }
        return { data: { user, demoOtp: '123456' }, error: null }
      }
    )
  },

  async verifyOtp(phoneOrEmail: string, otp: string, type: 'phone' | 'email' = 'phone') {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.auth.verifyOtp({
          [type]: phoneOrEmail,
          token: otp,
          type: type === 'phone' ? 'sms' : 'email',
        })
        return { data, error }
      },
      () => {
        if (otp !== '123456') return { error: 'Invalid OTP', data: null }
        const store = getMockStore()
        const field = type === 'phone' ? 'phone' : 'email'
        let user = store.findOne<UserProfile>('users_profile', { [field]: phoneOrEmail } as any)
        // Demo: auto-create user if not found during OTP verify
        if (!user) {
          const id = 'usr_' + Date.now()
          user = store.insert('users_profile', {
            id,
            user_id: id,
            name: type === 'email' ? phoneOrEmail.split('@')[0] : 'Demo User',
            [field]: phoneOrEmail,
            country: 'India',
            learning_completed: false,
            is_admin: phoneOrEmail === 'admin@notjust.com' || phoneOrEmail === '+919876543210',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) as UserProfile
          // Create learning_progress record for new user
          store.insert('learning_progress', {
            user_id: id,
            video_progress: {},
            quiz_completed: false,
            quiz_score: 0,
            created_at: new Date().toISOString(),
          })
        }
        return { data: user, error: null }
      }
    )
  },

  async register(userData: Partial<UserProfile>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('users_profile').insert([userData]).select().single()
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const now = new Date().toISOString()
        const user: UserProfile = {
          id: `usr_${Date.now()}`,
          user_id: userId,
          name: userData.name || 'New User',
          age: userData.age,
          gender: userData.gender,
          phone: userData.phone || undefined,
          email: userData.email || undefined,
          country: userData.country || 'India',
          state: userData.state,
          learning_completed: false,
          is_admin: false,
          created_at: now,
          updated_at: now,
        }
        store.insert('users_profile', user)
        store.insert('learning_progress', {
          id: `lp_${user.id}`,
          user_id: user.user_id,
          video_progress: {},
          quiz_completed: false,
          quiz_score: 0,
          created_at: now,
        })
        return { data: user, error: null }
      }
    )
  },

  async getUser(userId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('users_profile').select('*').eq('user_id', userId).single()
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const user = store.findOne<UserProfile>('users_profile', { user_id: userId } as any)
        return { data: user || null, error: user ? null : 'User not found' }
      }
    )
  },
}

// ============================================================
// CAMPAIGN SERVICE
// ============================================================
export const campaignService = {
  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
        return { data, error }
      },
      () => ({ data: getMockStore().getAll<Campaign>('campaigns'), error: null })
    )
  },

  async getActive() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('campaigns').select('*').eq('status', 'ACTIVE')
        return { data, error }
      },
      () => ({ data: getMockStore().find<Campaign>('campaigns', { status: 'ACTIVE' } as any), error: null })
    )
  },

  async create(campaign: Partial<Campaign>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('campaigns').insert([campaign]).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().insert('campaigns', { ...campaign, status: 'ACTIVE', created_at: new Date().toISOString() }), error: null })
    )
  },

  async updateStatus(id: string, status: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('campaigns').update({ status }).eq('id', id).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().update('campaigns', id, { status }), error: null })
    )
  },

  async getScanCounts() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('qr_scans').select('campaign_id')
        return { data, error }
      },
      () => {
        const scans = getMockStore().getAll<QrScan>('qr_scans')
        const counts: Record<string, number> = {}
        scans.forEach(s => {
          if (s.campaign_id) counts[s.campaign_id] = (counts[s.campaign_id] || 0) + 1
        })
        return { data: counts, error: null }
      }
    )
  },

  async getCampaignSales() {
    return tryRealOrMock(
      async () => {
        // For real Supabase: join qr_scans -> users -> orders
        const { data: scans } = await supabase.from('qr_scans').select('campaign_id, user_id')
        const { data: orders } = await supabase.from('orders').select('user_id, amount, status')
        const salesByCampaign: Record<string, { orderCount: number; revenue: number }> = {}
        if (scans && orders) {
          // Build user -> latest campaign mapping from scans
          const userCampaignMap: Record<string, string> = {}
          scans.forEach((s: any) => {
            if (s.user_id && s.campaign_id) userCampaignMap[s.user_id] = s.campaign_id
          })
          // Attribute orders to campaigns
          orders.forEach((o: any) => {
            const campId = userCampaignMap[o.user_id]
            if (campId && ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
              if (!salesByCampaign[campId]) salesByCampaign[campId] = { orderCount: 0, revenue: 0 }
              salesByCampaign[campId].orderCount++
              salesByCampaign[campId].revenue += o.amount || 0
            }
          })
        }
        return { data: salesByCampaign, error: null }
      },
      () => {
        const store = getMockStore()
        const scans = store.getAll<QrScan>('qr_scans')
        const orders = store.getAll<Order>('orders')
        const salesByCampaign: Record<string, { orderCount: number; revenue: number; users: string[] }> = {}

        // Build user -> campaign mapping from scans (most recent scan wins)
        const userScans = scans.filter(s => s.user_id && s.campaign_id)
        const userCampaignMap: Record<string, string> = {}
        userScans.forEach(s => {
          userCampaignMap[s.user_id!] = s.campaign_id!
        })

        // Attribute orders to campaigns
        orders.forEach(o => {
          const campId = userCampaignMap[o.user_id]
          if (campId && ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
            if (!salesByCampaign[campId]) salesByCampaign[campId] = { orderCount: 0, revenue: 0, users: [] }
            salesByCampaign[campId].orderCount++
            salesByCampaign[campId].revenue += o.amount || 0
            if (!salesByCampaign[campId].users.includes(o.user_id)) {
              salesByCampaign[campId].users.push(o.user_id)
            }
          }
        })

        return { data: salesByCampaign, error: null }
      }
    )
  },
}

// ============================================================
// QR SCAN SERVICE
// ============================================================
export const qrScanService = {
  async recordScan(scan: Partial<QrScan>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('qr_scans').insert([scan]).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().insert('qr_scans', { ...scan, created_at: new Date().toISOString() }), error: null })
    )
  },

  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('qr_scans').select('*').order('created_at', { ascending: false })
        return { data, error }
      },
      () => ({ data: getMockStore().getAll<QrScan>('qr_scans'), error: null })
    )
  },
}

// ============================================================
// LEARNING SERVICE
// ============================================================
export const learningService = {
  async getProgress(userId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('learning_progress').select('*').eq('user_id', userId).single()
        return { data, error }
      },
      () => {
        const progress = getMockStore().findOne<LearningProgress>('learning_progress', { user_id: userId } as any)
        return { data: progress || null, error: null }
      }
    )
  },

  async updateVideoProgress(userId: string, videoProgress: Record<string, number>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('learning_progress').upsert({ user_id: userId, video_progress: videoProgress }).eq('user_id', userId).select().single()
        return { data, error }
      },
      () => {
        const existing = getMockStore().findOne<LearningProgress>('learning_progress', { user_id: userId } as any)
        if (existing) {
          return { data: getMockStore().update('learning_progress', existing.id, { video_progress: videoProgress }), error: null }
        }
        return { data: getMockStore().insert('learning_progress', { user_id: userId, video_progress: videoProgress, quiz_completed: false, quiz_score: 0, created_at: new Date().toISOString() }), error: null }
      }
    )
  },

  async completeQuiz(userId: string, score: number) {
    return tryRealOrMock(
      async () => {
        // Try update first, if no row exists then insert
        const { data: existing } = await supabase.from('learning_progress').select('id').eq('user_id', userId).single()
        if (existing) {
          const { data, error } = await supabase.from('learning_progress').update({
            quiz_completed: true, quiz_score: score, completed_at: new Date().toISOString(),
          }).eq('user_id', userId).select().single()
          return { data, error }
        }
        const { data, error } = await supabase.from('learning_progress').insert([{
          user_id: userId, quiz_completed: true, quiz_score: score, video_progress: {},
          completed_at: new Date().toISOString(),
        }]).select().single()
        return { data, error }
      },
      () => {
        const existing = getMockStore().findOne<LearningProgress>('learning_progress', { user_id: userId } as any)
        if (existing) {
          getMockStore().update('learning_progress', existing.id, {
            quiz_completed: true, quiz_score: score, completed_at: new Date().toISOString(),
          })
        } else {
          // Create learning_progress record if it doesn't exist (e.g. for auto-created users)
          getMockStore().insert('learning_progress', {
            user_id: userId, video_progress: {}, quiz_completed: true, quiz_score: score,
            completed_at: new Date().toISOString(), created_at: new Date().toISOString(),
          })
        }
        const user = getMockStore().findOne<UserProfile>('users_profile', { user_id: userId } as any)
        if (user) {
          getMockStore().update('users_profile', user.id, { learning_completed: true })
        }
        return { data: { success: true }, error: null }
      }
    )
  },
}

// ============================================================
// QUIZ SERVICE
// ============================================================
export const quizService = {
  async getQuestions(count: number = 5) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('quiz_questions').select('*').eq('active', true).limit(count)
        return { data, error }
      },
      () => {
        const all = getMockStore().find<QuizQuestion>('quiz_questions', { active: true } as any)
        const shuffled = [...all].sort(() => Math.random() - 0.5)
        return { data: shuffled.slice(0, count), error: null }
      }
    )
  },

  async createQuestion(question: Partial<QuizQuestion>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('quiz_questions').insert([question]).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().insert('quiz_questions', { ...question, active: true }), error: null })
    )
  },

  async updateQuestion(id: string, data: Partial<QuizQuestion>) {
    return tryRealOrMock(
      async () => {
        const { data: updated, error } = await supabase.from('quiz_questions').update(data).eq('id', id).select().single()
        return { data: updated, error }
      },
      () => ({ data: getMockStore().update('quiz_questions', id, data), error: null })
    )
  },

  async deleteQuestion(id: string) {
    return tryRealOrMock(
      async () => {
        const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
        return { data: !error, error }
      },
      () => ({ data: getMockStore().delete('quiz_questions', id), error: null })
    )
  },

  async getByProduct(productId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('quiz_questions').select('*').eq('product_id', productId).eq('active', true)
        return { data, error }
      },
      () => ({ data: getMockStore().find<QuizQuestion>('quiz_questions', { product_id: productId, active: true } as any), error: null })
    )
  },
}

// ============================================================
// PRODUCT SERVICE
// ============================================================
export const productService = {
  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: true })
        return { data, error }
      },
      () => ({ data: getMockStore().find<Product>('products', { active: true } as any), error: null })
    )
  },

  async getById(id: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
        return { data, error }
      },
      () => ({ data: getMockStore().getById<Product>('products', id) || null, error: null })
    )
  },

  async create(data: Partial<Product>) {
    return tryRealOrMock(
      async () => {
        const { data: product, error } = await supabase.from('products').insert([data]).select().single()
        return { data: product, error }
      },
      () => ({ data: getMockStore().insert('products', { ...data, active: true, created_at: new Date().toISOString() }), error: null })
    )
  },

  async update(id: string, data: Partial<Product>) {
    return tryRealOrMock(
      async () => {
        const { data: updated, error } = await supabase.from('products').update(data).eq('id', id).select().single()
        return { data: updated, error }
      },
      () => ({ data: getMockStore().update('products', id, data), error: null })
    )
  },
}

// ============================================================
// ORDER SERVICE
// ============================================================
export const orderService = {
  async create(userId: string, items: { productId: string; quantity: number; purchaseType?: 'one-time' | 'subscription' }[], shippingAddress: any, paymentGateway: string = 'RAZORPAY', orderType: 'one-time' | 'subscription' = 'one-time') {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('orders').insert([{
          user_id: userId, status: 'CONFIRMED', order_type: orderType, amount: 0, payment_gateway: paymentGateway, shipping_address: shippingAddress,
        }]).select().single()
        return { data, error }
      },
      () => {
        const store = getMockStore()
        let totalAmount = 0
        const orderItems: any[] = []
        for (const item of items) {
          const product = store.getById<Product>('products', item.productId)
          if (!product) continue
          const price = item.purchaseType === 'subscription' && product.subscription_price ? product.subscription_price : product.price
          totalAmount += price * item.quantity
          orderItems.push({ product_id: product.id, quantity: item.quantity, price })
        }
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const now = new Date().toISOString()
        const order = store.insert('orders', {
          user_id: userId, status: 'CONFIRMED', order_type: orderType, amount: totalAmount,
          payment_gateway: paymentGateway, payment_id: paymentId,
          shipping_address: shippingAddress, created_at: now, updated_at: now,
        })
        for (const oi of orderItems) {
          store.insert('order_items', { order_id: order.id, ...oi })
        }
        return { data: order, error: null }
      }
    )
  },

  async getByUser(userId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('orders').select('*, items:order_items(*, product:products(*))').eq('user_id', userId).order('created_at', { ascending: false })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const orders = store.find<Order>('orders', { user_id: userId } as any)
        const withItems = orders.map(o => ({
          ...o,
          items: store.find<OrderItem>('order_items', { order_id: o.id } as any).map(oi => ({
            ...oi, product: store.getById<Product>('products', oi.product_id),
          })),
        }))
        return { data: withItems, error: null }
      }
    )
  },

  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('orders').select('*, items:order_items(*, product:products(*)), user:users_profile(name, email, phone)').order('created_at', { ascending: false })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const orders = store.getAll<Order>('orders')
        const withItems = orders.map(o => ({
          ...o,
          user: store.findOne<UserProfile>('users_profile', { user_id: o.user_id } as any),
          items: store.find<OrderItem>('order_items', { order_id: o.id } as any).map(oi => ({
            ...oi, product: store.getById<Product>('products', oi.product_id),
          })),
        }))
        return { data: withItems, error: null }
      }
    )
  },

  async updateStatus(orderId: string, status: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().update('orders', orderId, { status, updated_at: new Date().toISOString() }), error: null })
    )
  },
}

// ============================================================
// ADMIN STATS SERVICE
// ============================================================
export const adminStatsService = {
  async getDashboardStats() {
    return tryRealOrMock(
      async () => {
        const [users, scans, orders, campaigns] = await Promise.all([
          supabase.from('users_profile').select('*', { count: 'exact', head: true }),
          supabase.from('qr_scans').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('status, amount'),
          supabase.from('campaigns').select('channel, status'),
        ])
        return { data: { totalUsers: users.count, totalScans: scans.count, totalOrders: orders.data?.length, totalCampaigns: campaigns.data?.length }, error: null }
      },
      () => {
        const store = getMockStore()
        const totalUsers = store.count('users_profile')
        const totalScans = store.count('qr_scans')
        const totalOrders = store.count('orders')
        const learningCompleted = store.count('users_profile', { learning_completed: true } as any)
        const totalCampaigns = store.count('campaigns')
        const orders = store.getAll<Order>('orders')
        const totalRevenue = orders.filter(o => ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)).reduce((sum, o) => sum + o.amount, 0)
        const conversionRate = totalUsers > 0 ? ((learningCompleted / totalUsers) * 100).toFixed(1) : '0'

        const ordersByStatus: Record<string, number> = {}
        orders.forEach(o => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1 })

        const scans = store.getAll<QrScan>('qr_scans')
        const scansByCampaign: Record<string, number> = {}
        scans.forEach(s => { if (s.campaign_id) scansByCampaign[s.campaign_id] = (scansByCampaign[s.campaign_id] || 0) + 1 })

        const campaigns = store.getAll<Campaign>('campaigns')
        const campaignsByChannel: Record<string, number> = {}
        campaigns.forEach(c => { campaignsByChannel[c.channel] = (campaignsByChannel[c.channel] || 0) + 1 })

        const recentUsers = [...store.getAll<UserProfile>('users_profile')].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

        const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map(o => ({
          ...o,
          user: store.findOne<UserProfile>('users_profile', { user_id: o.user_id } as any),
          items: store.find<OrderItem>('order_items', { order_id: o.id } as any).map(oi => ({
            ...oi, product: store.getById<Product>('products', oi.product_id),
          })),
        }))

        return {
          data: {
            totalUsers, totalScans, totalOrders, learningCompleted, totalCampaigns, totalRevenue,
            conversionRate, ordersByStatus, scansByCampaign, campaignsByChannel, recentUsers, recentOrders,
          }, error: null,
        }
      }
    )
  },
}

// ============================================================
// USER SERVICE (Admin)
// ============================================================
export const userService = {
  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('users_profile').select('*, learning_progress(*)').order('created_at', { ascending: false })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const users = store.getAll<UserProfile>('users_profile')
        return { data: users.map(u => ({
          ...u,
          learning_progress: store.findOne<LearningProgress>('learning_progress', { user_id: u.user_id } as any),
          _count: {
            orders: store.find('orders', { user_id: u.user_id } as any).length,
            qr_scans: store.find('qr_scans', { user_id: u.user_id } as any).length,
          },
        })), error: null }
      }
    )
  },

  async updateLearningCompleted(userId: string, completed: boolean) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('users_profile').update({ learning_completed: completed }).eq('user_id', userId)
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const user = store.findOne<UserProfile>('users_profile', { user_id: userId } as any)
        if (user) store.update('users_profile', user.id, { learning_completed: completed })
        return { data: { success: true }, error: null }
      }
    )
  },
}

// ============================================================
// PRODUCT VIDEO SERVICE
// ============================================================
export const productVideoService = {
  async getByProduct(productId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('product_videos').select('*').eq('product_id', productId).order('order_index', { ascending: true })
        return { data, error }
      },
      () => {
        const videos = getMockStore().find<ProductVideo>('product_videos', { product_id: productId } as any)
        const sorted = [...videos].sort((a, b) => a.order_index - b.order_index)
        return { data: sorted, error: null }
      }
    )
  },

  async create(video: Partial<ProductVideo>) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('product_videos').insert([video]).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().insert('product_videos', { ...video, created_at: new Date().toISOString() }), error: null })
    )
  },

  async update(id: string, data: Partial<ProductVideo>) {
    return tryRealOrMock(
      async () => {
        const { data: updated, error } = await supabase.from('product_videos').update(data).eq('id', id).select().single()
        return { data: updated, error }
      },
      () => ({ data: getMockStore().update('product_videos', id, data), error: null })
    )
  },

  async delete(id: string) {
    return tryRealOrMock(
      async () => {
        const { error } = await supabase.from('product_videos').delete().eq('id', id)
        return { data: !error, error }
      },
      () => ({ data: getMockStore().delete('product_videos', id), error: null })
    )
  },

  async reorder(productId: string, videoIds: string[]) {
    return tryRealOrMock(
      async () => {
        // Update order_index for each video
        const updates = videoIds.map((videoId, index) =>
          supabase.from('product_videos').update({ order_index: index + 1 }).eq('id', videoId).eq('product_id', productId)
        )
        await Promise.all(updates)
        const { data, error } = await supabase.from('product_videos').select('*').eq('product_id', productId).order('order_index', { ascending: true })
        return { data, error }
      },
      () => {
        const store = getMockStore()
        videoIds.forEach((videoId, index) => {
          store.update('product_videos', videoId, { order_index: index + 1 })
        })
        const videos = store.find<ProductVideo>('product_videos', { product_id: productId } as any)
        const sorted = [...videos].sort((a, b) => a.order_index - b.order_index)
        return { data: sorted, error: null }
      }
    )
  },
}

// ============================================================
// SUBSCRIPTION SERVICE
// ============================================================
export const subscriptionService = {
  async create(userId: string, productId: string, amount: number, interval: 'MONTHLY' | 'QUARTERLY') {
    return tryRealOrMock(
      async () => {
        const now = new Date()
        const nextBilling = new Date(now)
        if (interval === 'MONTHLY') nextBilling.setMonth(nextBilling.getMonth() + 1)
        else nextBilling.setMonth(nextBilling.getMonth() + 3)
        const { data, error } = await supabase.from('subscriptions').insert([{
          user_id: userId, product_id: productId, status: 'ACTIVE', amount, interval,
          start_date: now.toISOString(), next_billing_date: nextBilling.toISOString(),
        }]).select().single()
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const now = new Date()
        const nextBilling = new Date(now)
        if (interval === 'MONTHLY') nextBilling.setMonth(nextBilling.getMonth() + 1)
        else nextBilling.setMonth(nextBilling.getMonth() + 3)
        const sub = store.insert('subscriptions', {
          user_id: userId, product_id: productId, status: 'ACTIVE', amount, interval,
          start_date: now.toISOString(), next_billing_date: nextBilling.toISOString(),
          created_at: now.toISOString(),
        })
        return { data: sub, error: null }
      }
    )
  },

  async getByUser(userId: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        return { data, error }
      },
      () => {
        const subs = getMockStore().find<Subscription>('subscriptions', { user_id: userId } as any)
        return { data: subs, error: null }
      }
    )
  },

  async cancel(id: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('subscriptions').update({ status: 'CANCELLED' }).eq('id', id).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().update('subscriptions', id, { status: 'CANCELLED' }), error: null })
    )
  },

  async pause(id: string) {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('subscriptions').update({ status: 'PAUSED' }).eq('id', id).select().single()
        return { data, error }
      },
      () => ({ data: getMockStore().update('subscriptions', id, { status: 'PAUSED' }), error: null })
    )
  },

  async resume(id: string) {
    return tryRealOrMock(
      async () => {
        const sub = getMockStore().getById<Subscription>('subscriptions', id)
        const nextBilling = new Date()
        if (sub?.interval === 'MONTHLY') nextBilling.setMonth(nextBilling.getMonth() + 1)
        else nextBilling.setMonth(nextBilling.getMonth() + 3)
        const { data, error } = await supabase.from('subscriptions').update({ status: 'ACTIVE', next_billing_date: nextBilling.toISOString() }).eq('id', id).select().single()
        return { data, error }
      },
      () => {
        const store = getMockStore()
        const sub = store.getById<Subscription>('subscriptions', id)
        const nextBilling = new Date()
        if (sub?.interval === 'MONTHLY') nextBilling.setMonth(nextBilling.getMonth() + 1)
        else nextBilling.setMonth(nextBilling.getMonth() + 3)
        return { data: store.update('subscriptions', id, { status: 'ACTIVE', next_billing_date: nextBilling.toISOString() }), error: null }
      }
    )
  },

  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false })
        return { data, error }
      },
      () => ({ data: getMockStore().getAll<Subscription>('subscriptions'), error: null })
    )
  },
}

// ============================================================
// GUARANTEE PLAN SERVICE
// ============================================================
export const guaranteeService = {
  async getAll() {
    return tryRealOrMock(
      async () => {
        const { data, error } = await supabase.from('guarantee_plans').select('*').eq('active', true)
        return { data, error }
      },
      () => ({ data: getMockStore().find<GuaranteePlan>('guarantee_plans', { active: true } as any), error: null })
    )
  },
}
