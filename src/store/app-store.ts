import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, Product } from '@/lib/data-service'

export type AppView =
  | 'landing'
  | 'auth-login'
  | 'auth-register'
  | 'auth-otp'
  | 'learning'
  | 'quiz'
  | 'products'
  | 'product-detail'
  | 'product-learning'
  | 'product-quiz'
  | 'subscriptions'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-campaigns'
  | 'admin-qr'
  | 'admin-orders'
  | 'admin-analytics'
  | 'admin-content'
  | 'admin-products'
  | 'admin-subscriptions'
  | 'profile'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  type: string
  purchaseType: 'one-time' | 'subscription'
  // Subscription metadata (only when purchaseType === 'subscription')
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
  pendingOtpContact: string | null
  pendingOtpType: 'phone' | 'email'
  setPendingOtp: (contact: string | null, type: 'phone' | 'email') => void

  // Product Learning
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void

  // Learning
  currentVideoIndex: number
  setCurrentVideoIndex: (idx: number) => void
  currentQuizIndex: number
  setCurrentQuizIndex: (idx: number) => void

  // Subscription
  selectedSubscriptionId: string | null
  setSelectedSubscriptionId: (id: string | null) => void

  // Commerce
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: () => number

  // Campaign
  scannedCampaignId: string | null
  setScannedCampaignId: (id: string | null) => void

  // Admin tab
  adminTab: string
  setAdminTab: (tab: string) => void

  // Products cache
  products: Product[]
  setProducts: (products: Product[]) => void

  // Last order ID for success page
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
      pendingOtpContact: null,
      pendingOtpType: 'phone',
      setPendingOtp: (contact, type) => set({ pendingOtpContact: contact, pendingOtpType: type }),

      // Product Learning
      selectedProductId: null,
      setSelectedProductId: (id) => set({ selectedProductId: id }),

      // Learning
      currentVideoIndex: 0,
      setCurrentVideoIndex: (idx) => set({ currentVideoIndex: idx }),
      currentQuizIndex: 0,
      setCurrentQuizIndex: (idx) => set({ currentQuizIndex: idx }),

      // Subscription
      selectedSubscriptionId: null,
      setSelectedSubscriptionId: (id) => set({ selectedSubscriptionId: id }),

      // Commerce
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            }
          }
          return { cart: [...state.cart, item] }
        }),
      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) })),
      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((i) => i.productId !== productId)
            : state.cart.map((i) => i.productId === productId ? { ...i, quantity } : i),
        })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

      // Campaign
      scannedCampaignId: null,
      setScannedCampaignId: (id) => set({ scannedCampaignId: id }),

      // Admin
      adminTab: 'dashboard',
      setAdminTab: (tab) => set({ adminTab: tab }),

      // Products
      products: [],
      setProducts: (products) => set({ products }),

      // Last order
      lastOrderId: null,
      setLastOrderId: (id) => set({ lastOrderId: id }),
    }),
    {
      name: 'notjust-app-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        currentView: state.currentView,
        products: state.products,
        selectedProductId: state.selectedProductId,
      }),
    }
  )
)
