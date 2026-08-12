import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, Product } from '@/lib/data-service'

export type AppView =
  | 'landing'
  | 'our-journey'
  | 'products'
  | 'product-detail'
  | 'product-learning'
  | 'auth-login'
  | 'auth-register'
  | 'auth-whatsapp-otp'
  | 'auth-forgot-password'
  | 'auth-reset-password'
  | 'auth-verify-email'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'subscriptions'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-users'
  | 'admin-campaigns'
  | 'admin-qr'
  | 'admin-orders'
  | 'admin-analytics'
  | 'admin-content'
  | 'admin-subscriptions'
  | 'admin-learning'
  | 'learning'
  | 'quiz'
  | 'policy-terms'
  | 'policy-privacy'
  | 'policy-shipping'
  | 'policy-refund'
  | 'policy-grievance'
  | 'policy-about'
  | 'policy-contact'
  | 'qa-report'

// ─── View → URL path mapping ─────────────────────────────────
const viewToPath: Record<AppView, string> = {
  'landing': '/',
  'our-journey': '/journey',
  'products': '/products',
  'product-detail': '/product',
  'product-learning': '/learn',
  'auth-login': '/login',
  'auth-register': '/register',
  'auth-whatsapp-otp': '/whatsapp-login',
  'auth-forgot-password': '/forgot-password',
  'auth-reset-password': '/reset-password',
  'auth-verify-email': '/verify-email',
  'cart': '/cart',
  'checkout': '/checkout',
  'order-success': '/order-success',
  'subscriptions': '/subscriptions',
  'profile': '/profile',
  'admin-dashboard': '/admin',
  'admin-products': '/admin/products',
  'admin-users': '/admin/users',
  'admin-campaigns': '/admin/campaigns',
  'admin-qr': '/admin/qr',
  'admin-orders': '/admin/orders',
  'admin-analytics': '/admin/analytics',
  'admin-content': '/admin/content',
  'admin-subscriptions': '/admin/subscriptions',
  'admin-learning': '/admin/learning',
  'learning': '/learn',
  'quiz': '/quiz',
  'policy-terms': '/terms',
  'policy-privacy': '/privacy',
  'policy-shipping': '/shipping',
  'policy-refund': '/refund',
  'policy-grievance': '/grievance',
  'policy-about': '/about',
  'policy-contact': '/contact',
  'qa-report': '/qa-report',
}

export function getViewPath(view: AppView, extra?: string): string {
  const base = viewToPath[view] || '/'
  return extra ? `${base}?${extra}` : base
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  cartKey?: string
  imageUrl?: string
  type?: string
  purchaseType: 'one-time' | 'subscription'
  packType?: string
  packDays?: number
  packDiscount?: number
}

export function getCartItemKey(item: Pick<CartItem, 'productId' | 'purchaseType' | 'packType'>): string {
  return [item.productId, item.purchaseType, item.packType || 'standard'].join(':')
}

interface AppState {
  // Navigation
  currentView: AppView
  previousView: AppView | null
  navigateTo: (view: AppView, extra?: string) => void
  goBack: () => void

  // Auth
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void

  // Product Learning
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void

  // Learning
  currentVideoIndex: number
  setCurrentVideoIndex: (idx: number) => void
  currentQuizIndex: number
  setCurrentQuizIndex: (idx: number) => void

  // Admin tab
  adminTab: string
  setAdminTab: (tab: string) => void

  // Products cache
  products: Product[]
  setProducts: (products: Product[]) => void

  // Redirect after login
  redirectAfterLogin: AppView | null
  setRedirectAfterLogin: (view: AppView | null) => void

  // Learning completion cache
  completedProductIds: string[]
  markProductCompleted: (productId: string) => void

  // URL share slug
  shareSlug: string | null
  setShareSlug: (slug: string | null) => void

  // OTP pending
  pendingOtpContact: string | null
  pendingOtpType: 'phone' | 'email' | null
  setPendingOtp: (contact: string | null, type: 'phone' | 'email' | null) => void

  // QR scan
  scannedCampaignId: string | null
  setScannedCampaignId: (id: string | null) => void

  // Subscription selection
  selectedSubscriptionId: string | null
  setSelectedSubscriptionId: (id: string | null) => void

  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  cartTotal: () => number
  clearCart: () => void

  // Orders
  lastOrderId: string | null
  lastOrderNumber: string | null
  lastPaymentMethod: string | null
  setLastOrderId: (id: string | null) => void
  setLastOrderNumber: (num: string | null) => void
  setLastPaymentMethod: (method: string | null) => void

  // Full logout reset
  resetForLogout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'landing',
      previousView: null,
      navigateTo: (view, extra) => {
        const prev = get().currentView
        set({ previousView: prev, currentView: view })
        // Sync browser URL with the view
        if (typeof window !== 'undefined') {
          const path = getViewPath(view, extra)
          // Only push if the path is different from current URL
          if (window.location.pathname + window.location.search !== path) {
            window.history.pushState({ view, extra }, '', path)
          }
          // Scroll to top on navigation
          window.scrollTo({ top: 0, behavior: 'instant' })
        }
      },
      goBack: () => {
        if (typeof window !== 'undefined') {
          // Use browser history for back navigation — popstate listener will update Zustand
          window.history.back()
        } else {
          // Fallback for SSR
          const prev = get().previousView
          if (prev) set({ currentView: prev, previousView: null })
          else set({ currentView: 'landing' })
        }
      },

      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Product Learning
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),

      // Learning
      currentVideoIndex: 0,
      setCurrentVideoIndex: (idx) => set({ currentVideoIndex: idx }),
      currentQuizIndex: 0,
      setCurrentQuizIndex: (idx) => set({ currentQuizIndex: idx }),

      // Admin
      adminTab: 'dashboard',
      setAdminTab: (tab) => set({ adminTab: tab }),

      // Products
      products: [],
      setProducts: (products) => set({ products }),

      // Redirect after login
      redirectAfterLogin: null,
      setRedirectAfterLogin: (view) => set({ redirectAfterLogin: view }),

      // Learning completion cache
      completedProductIds: [],
      markProductCompleted: (productId) => {
        const completedProductIds = get().completedProductIds
        if (!completedProductIds.includes(productId)) {
          set({ completedProductIds: [...completedProductIds, productId] })
        }
      },

      // URL share slug
      shareSlug: null,
      setShareSlug: (slug) => set({ shareSlug: slug }),

      // OTP pending
      pendingOtpContact: null,
      pendingOtpType: null,
      setPendingOtp: (contact, type) => set({ pendingOtpContact: contact, pendingOtpType: type }),

      // QR scan
      scannedCampaignId: null,
      setScannedCampaignId: (id) => set({ scannedCampaignId: id }),

      // Subscription selection
      selectedSubscriptionId: null,
      setSelectedSubscriptionId: (id) => set({ selectedSubscriptionId: id }),

      // Cart
      cart: [],
      addToCart: (item) => {
        const cart = get().cart
        const cartKey = item.cartKey || getCartItemKey(item)
        const existing = cart.find(i => (i.cartKey || getCartItemKey(i)) === cartKey)
        if (existing) {
          set({
            cart: cart.map(i => (i.cartKey || getCartItemKey(i)) === cartKey
              ? { ...i, cartKey, quantity: i.quantity + item.quantity }
              : i)
          })
        } else {
          set({ cart: [...cart, { ...item, cartKey }] })
        }
      },
      removeFromCart: (cartKey) => set({ cart: get().cart.filter(i => (i.cartKey || getCartItemKey(i)) !== cartKey) }),
      updateCartQuantity: (cartKey, quantity) => {
        if (quantity <= 0) {
          set({ cart: get().cart.filter(i => (i.cartKey || getCartItemKey(i)) !== cartKey) })
        } else {
          set({ cart: get().cart.map(i => (i.cartKey || getCartItemKey(i)) === cartKey ? { ...i, cartKey, quantity } : i) })
        }
      },
      cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      clearCart: () => {
        set({ cart: [] })
        // Also clear from localStorage immediately
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('notjust-app-store')
            if (stored) {
              const parsed = JSON.parse(stored)
              parsed.state.cart = []
              localStorage.setItem('notjust-app-store', JSON.stringify(parsed))
            }
          } catch { /* ignore */ }
        }
      },

      // Orders
      lastOrderId: null,
      lastOrderNumber: null,
      lastPaymentMethod: null,
      setLastOrderId: (id) => set({ lastOrderId: id }),
      setLastOrderNumber: (num) => set({ lastOrderNumber: num }),
      setLastPaymentMethod: (method) => set({ lastPaymentMethod: method }),

      // Full reset for logout
      resetForLogout: () => {
        // First set all state to defaults
        set({
          user: null,
          cart: [],
          lastOrderId: null,
          lastOrderNumber: null,
          lastPaymentMethod: null,
          selectedProductId: null,
          pendingOtpContact: null,
          pendingOtpType: null,
          scannedCampaignId: null,
          selectedSubscriptionId: null,
          redirectAfterLogin: null,
          shareSlug: null,
          currentView: 'landing',
          previousView: null,
          completedProductIds: [],
        })
      },

    }),
    {
      name: 'notjust-app-store',
      partialize: (state) => {
        // Don't persist auth-related views to prevent getting stuck on login page
        const authViews = ['auth-login', 'auth-register', 'auth-whatsapp-otp', 'auth-forgot-password', 'auth-reset-password', 'auth-verify-email']
        const safeView = authViews.includes(state.currentView) ? 'landing' : state.currentView
        return {
          user: state.user,
          currentView: safeView,
          adminTab: state.adminTab,
          products: state.products,
          selectedProductId: state.selectedProductId,
          cart: state.cart,
          lastOrderId: state.lastOrderId,
          lastOrderNumber: state.lastOrderNumber,
          lastPaymentMethod: state.lastPaymentMethod,
          pendingOtpContact: state.pendingOtpContact,
          pendingOtpType: state.pendingOtpType,
          scannedCampaignId: state.scannedCampaignId,
          completedProductIds: state.completedProductIds,
        }
      },
    }
  )
)
