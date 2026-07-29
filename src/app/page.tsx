'use client'

import React, { useEffect, Suspense, lazy } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'

// ─── Eager: Landing + Product (most common views) ────────────
import LandingPageComponent from '@/components/LandingPage'
import ProductPage from '@/components/ProductPage'

// ─── Lazy-loaded: Heavy components (code-split for faster initial load) ──
const OurJourneyPage = lazy(() =>
  import('@/components/OurJourneyPage').then(m => ({ default: m.OurJourneyPage }))
)
const AuthLogin = lazy(() =>
  import('@/components/AuthPages').then(m => ({ default: m.AuthLogin }))
)
const AuthRegister = lazy(() =>
  import('@/components/AuthPages').then(m => ({ default: m.AuthRegister }))
)
const AuthForgotPassword = lazy(() =>
  import('@/components/AuthPages').then(m => ({ default: m.AuthForgotPassword }))
)
const AuthWhatsAppOtpLogin = lazy(() =>
  import('@/components/AuthWhatsAppOtpLogin').then(m => ({ default: m.AuthWhatsAppOtpLogin }))
)
const ProfilePage = lazy(() =>
  import('@/components/ProfilePage').then(m => ({ default: m.ProfilePage }))
)
const ProductDetailPage = lazy(() =>
  import('@/components/ProductDetailPage').then(m => ({ default: m.default }))
)
const ProductLearningModule = lazy(() =>
  import('@/components/ProductLearningModule').then(m => ({ default: m.ProductLearningModule }))
)
const AdminPanel = lazy(() =>
  import('@/components/AdminPanel').then(m => ({ default: m.default }))
)
const CartView = lazy(() =>
  import('@/components/CartCheckout').then(m => ({ default: m.CartView }))
)
const CheckoutView = lazy(() =>
  import('@/components/CartCheckout').then(m => ({ default: m.CheckoutView }))
)
const OrderSuccessView = lazy(() =>
  import('@/components/CartCheckout').then(m => ({ default: m.OrderSuccessView }))
)

// ─── Loading fallback for lazy views ─────────────────────────
function ViewLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#48805b]/30 border-t-[#48805b] rounded-full animate-spin" />
        <span className="text-[#88837b] font-heading text-sm">Loading...</span>
      </div>
    </div>
  )
}

// ─── URL Sync: reads ?product=slug and navigates ────────────
function UrlSyncHandler() {
  const searchParams = useSearchParams()
  const { navigateTo, setSelectedProductId, products, setProducts } = useAppStore()
  const currentView = useAppStore(s => s.currentView)

  useEffect(() => {
    const slug = searchParams.get('product')
    if (!slug) return

    // Find product by slug and navigate
    const findAndNavigate = async () => {
      if (products.length === 0) {
        // Products not loaded yet, fetch them
        try {
          const { productService } = await import('@/lib/data-service')
          const prods = await productService.list({ active: true })
          setProducts(prods)
          const found = prods.find(p => p.slug === slug)
          if (found) {
            setSelectedProductId(found.id)
            if (currentView !== 'product-detail' && currentView !== 'product-learning') {
              navigateTo('product-detail')
            }
          }
        } catch { /* ignore */ }
      } else {
        const found = products.find(p => p.slug === slug)
        if (found) {
          setSelectedProductId(found.id)
          if (currentView !== 'product-detail' && currentView !== 'product-learning') {
            navigateTo('product-detail')
          }
        }
      }
    }
    findAndNavigate()
  }, [searchParams]) // Only re-run when URL changes

  return null
}

// ─── View Renderer ──────────────────────────────────────────
function ViewRenderer() {
  const currentView = useAppStore(s => s.currentView)

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPageComponent />
      case 'our-journey':
        return <OurJourneyPage />
      case 'products':
        return <ProductPage />
      case 'product-detail':
        return <ProductDetailPage />
      case 'product-learning':
        return <ProductLearningModule />
      case 'auth-login':
        return <AuthLogin />
      case 'auth-register':
        return <AuthRegister />
      case 'auth-whatsapp-otp':
        return <AuthWhatsAppOtpLogin />
      case 'auth-forgot-password':
      case 'auth-reset-password':
        return <AuthForgotPassword />
      case 'auth-verify-email':
        return <AuthForgotPassword />
      case 'cart':
        return <CartView />
      case 'checkout':
        return <CheckoutView />
      case 'order-success':
        return <OrderSuccessView />
      case 'profile':
        return <ProfilePage />
      case 'admin-dashboard':
      case 'admin-products':
      case 'admin-users':
      case 'admin-campaigns':
      case 'admin-qr':
      case 'admin-orders':
      case 'admin-analytics':
      case 'admin-content':
      case 'admin-subscriptions':
      case 'admin-learning':
        return <AdminPanel />
      default:
        return <LandingPageComponent />
    }
  }

  return (
    <Suspense fallback={<ViewLoadingFallback />}>
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </Suspense>
  )
}

// ─── Main Page ──────────────────────────────────────────────
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]"><div className="animate-pulse text-[#48805b] font-heading text-xl">Loading...</div></div>}>
      <UrlSyncHandler />
      <ViewRenderer />
    </Suspense>
  )
}
