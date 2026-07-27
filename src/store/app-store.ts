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

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  type?: string
  purchaseType: 'one-time' | 'subscription'
  packType?: string
  packDays?: number
  packDiscount?: number
}

interface AppState {
  // Navigation
  currentView: AppView
  previousView: AppView | null
  navigateTo: (view: AppView) => void
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
  setLastOrderId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'landing',
      previousView: null,
      navigateTo: (view) => set({ previousView: get().currentView, currentView: view }),
      goBack: () => {
        const prev = get().previousView
        if (prev) set({ currentView: prev, previousView: null })
        else set({ currentView: 'landing' })
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
        const existing = cart.find(i => i.productId === item.productId)
        if (existing) {
          set({ cart: cart.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i) })
        } else {
          set({ cart: [...cart, item] })
        }
      },
      removeFromCart: (productId) => set({ cart: get().cart.filter(i => i.productId !== productId) }),
      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ cart: get().cart.filter(i => i.productId !== productId) })
        } else {
          set({ cart: get().cart.map(i => i.productId === productId ? { ...i, quantity } : i) })
        }
      },
      cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      clearCart: () => set({ cart: [] }),

      // Orders
      lastOrderId: null,
      setLastOrderId: (id) => set({ lastOrderId: id }),

    }),
    {
      name: 'notjust-app-store',
      partialize: (state) => ({
        user: state.user,
        currentView: state.currentView,
        adminTab: state.adminTab,
        products: state.products,
        selectedProductId: state.selectedProductId,
        cart: state.cart,
        lastOrderId: state.lastOrderId,
        pendingOtpContact: state.pendingOtpContact,
        pendingOtpType: state.pendingOtpType,
        scannedCampaignId: state.scannedCampaignId,
      }),
    }
  )
)
