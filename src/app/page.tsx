'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'

// ─── View Components ────────────────────────────────────────
import LandingPageComponent from '@/components/LandingPage'
import { OurJourneyPage } from '@/components/OurJourneyPage'
import { AuthLogin, AuthRegister, AuthForgotPassword } from '@/components/AuthPages'
import { AuthWhatsAppOtpLogin } from '@/components/AuthWhatsAppOtpLogin'
import { ProfilePage } from '@/components/ProfilePage'
import ProductDetailPage from '@/components/ProductDetailPage'
import { ProductLearningModule } from '@/components/ProductLearningModule'
import AdminPanel from '@/components/AdminPanel'
import ProductPage from '@/components/ProductPage'
import { CartView, CheckoutView, OrderSuccessView } from '@/components/CartCheckout'

// ─── URL → View mapping ─────────────────────────────────────
const pathToView = (pathname: string): AppView => {
  switch (pathname) {
    case '/journey': return 'our-journey'
    case '/products': return 'products'
    case '/product': return 'product-detail'
    case '/learn': return 'product-learning'
    case '/login': return 'auth-login'
    case '/register': return 'auth-register'
    case '/whatsapp-login': return 'auth-whatsapp-otp'
    case '/forgot-password': return 'auth-forgot-password'
    case '/reset-password': return 'auth-reset-password'
    case '/verify-email': return 'auth-verify-email'
    case '/cart': return 'cart'
    case '/checkout': return 'checkout'
    case '/order-success': return 'order-success'
    case '/subscriptions': return 'subscriptions'
    case '/profile': return 'profile'
    case '/admin': return 'admin-dashboard'
    case '/admin/products': return 'admin-products'
    case '/admin/users': return 'admin-users'
    case '/admin/campaigns': return 'admin-campaigns'
    case '/admin/qr': return 'admin-qr'
    case '/admin/orders': return 'admin-orders'
    case '/admin/analytics': return 'admin-analytics'
    case '/admin/content': return 'admin-content'
    case '/admin/subscriptions': return 'admin-subscriptions'
    case '/admin/learning': return 'admin-learning'
    default: return 'landing'
  }
}

// ─── URL Sync: reads ?product=slug and navigates ────────────
function UrlSyncHandler() {
  const searchParams = useSearchParams()
  const navigateTo = useAppStore(s => s.navigateTo)
  const setSelectedProductId = useAppStore(s => s.setSelectedProductId)
  const products = useAppStore(s => s.products)
  const setProducts = useAppStore(s => s.setProducts)
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
  }, [searchParams, products, setProducts, setSelectedProductId, navigateTo, currentView])

  return null
}

// ─── Browser History Sync: listens for back/forward ─────────
function BrowserHistorySync() {
  const setCurrentView = useAppStore(s => s.navigateTo)

  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      // Browser back/forward was pressed — update the app view from the URL
      const view = pathToView(window.location.pathname)
      // We use a direct set to avoid pushing a new history entry
      useAppStore.setState({ currentView: view, previousView: null })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setCurrentView])

  // Also handle initial page load — sync view from URL
  useEffect(() => {
    const view = pathToView(window.location.pathname)
    const currentView = useAppStore.getState().currentView
    if (view !== 'landing' && currentView !== view) {
      useAppStore.setState({ currentView: view, previousView: null })
    }
    // Replace the initial history entry with our state
    window.history.replaceState({ view }, '', window.location.pathname + window.location.search)
  }, [])

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
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ──────────────────────────────────────────────
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]"><div className="animate-pulse text-[#48805b] font-heading text-xl">Loading...</div></div>}>
      <BrowserHistorySync />
      <UrlSyncHandler />
      <ViewRenderer />
    </Suspense>
  )
}
