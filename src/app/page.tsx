'use client'

import React, { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'

// ─── Shared Navbar ──────────────────────────────────────────
import AppNavbar from '@/components/AppNavbar'

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
import PolicyPage from '@/components/PolicyPage'
import QATestReport from '@/components/QATestReport'

// ─── Views that should NOT show the shared navbar ────────────
const HIDE_NAVBAR_VIEWS: AppView[] = [
  'landing', // LandingPage has its own transparent-to-solid navbar
  'admin-dashboard', 'admin-products', 'admin-users', 'admin-campaigns',
  'admin-qr', 'admin-orders', 'admin-analytics', 'admin-content',
  'admin-subscriptions', 'admin-learning',
  'qa-report',
]

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
    case '/admin/invoices': return 'admin-invoices'
    case '/admin/analytics': return 'admin-analytics'
    case '/admin/content': return 'admin-content'
    case '/admin/subscriptions': return 'admin-subscriptions'
    case '/admin/learning': return 'admin-learning'
    case '/terms': return 'policy-terms'
    case '/privacy': return 'policy-privacy'
    case '/shipping': return 'policy-shipping'
    case '/refund': return 'policy-refund'
    case '/grievance': return 'policy-grievance'
    case '/about': return 'policy-about'
    case '/contact': return 'policy-contact'
    case '/qa-report': return 'qa-report'
    default: return 'landing'
  }
}

// ─── Tolerant product matching for QR / campaign / share links ────────────
// QR codes built by the admin panel encode `product.slug || slugify(name)`. If a
// product's stored slug ever drifts (legacy name-based link, case/separator
// differences), an exact `p.slug === slug` lookup fails silently and the visitor
// never reaches the product. Match on stored slug OR normalized slug OR
// normalized name so all these link variants resolve.
const normSlug = (s: string | null | undefined) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const matchesProductSlug = (p: { slug: string; name: string }, slug: string) =>
  p.slug === slug || normSlug(p.slug) === normSlug(slug) || normSlug(p.name) === normSlug(slug)

// ─── URL Sync: reads ?product=slug and navigates ────────────
function UrlSyncHandler() {
  const searchParams = useSearchParams()
  const navigateTo = useAppStore(s => s.navigateTo)
  const setSelectedProductId = useAppStore(s => s.setSelectedProductId)
  const products = useAppStore(s => s.products)
  const setProducts = useAppStore(s => s.setProducts)
  const currentView = useAppStore(s => s.currentView)
  // Track which campaign IDs have already been scanned in this session
  // to prevent duplicate scan records when the useEffect re-runs
  const scannedCampaignRef = useRef<string | null>(null)

  useEffect(() => {
    // ── Read the LIVE URL (window.location), NOT useSearchParams ──
    // useSearchParams does NOT update on manual history.pushState calls
    // (which is exactly how this SPA navigates), so it keeps returning the
    // ENTRY link's query long after the address bar changed. That staleness
    // caused this: open a campaign/general product link (?product=slug),
    // press Home → URL becomes clean '/', but the stale ?product=slug made
    // the sync below navigate BACK to product-detail — the user appeared
    // stuck on the product page (it just "refreshed").
    // Deriving everything from window.location makes the address bar the
    // single source of truth.
    const liveParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')

    // Capture campaign ID from URL (?campaign=ID) — stored for checkout attribution
    // Only record the scan ONCE per campaign per page session
    const campaignId = liveParams.get('campaign')
    if (campaignId && typeof window !== 'undefined') {
      localStorage.setItem('notjust_campaign_id', campaignId)
      // Only POST the scan if we haven't already for this campaign
      if (scannedCampaignRef.current !== campaignId) {
        scannedCampaignRef.current = campaignId
        fetch('/api/scans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign_id: campaignId, device: navigator.userAgent }),
        }).catch(() => {})
      }
    }

    // Handle PhonePe payment return redirect
    const paymentReturn = liveParams.get('payment')
    if (paymentReturn === 'return') {
      if (currentView !== 'order-success') {
        navigateTo('order-success')
      }
      return
    }

    const slug = liveParams.get('product')
    if (!slug) return

    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    const isProductLinkPath = pathname === '/' || pathname === '/product'

    // Don't override user-initiated navigations to other views.
    // The only views where product-sync should be ACTIVE are:
    //   'product-detail' (current product display) and
    //   'product-learning' (learning module for the product) —
    // plus the first render on a general/product link ('/' or '/product')
    // where the view hasn't been switched to the product yet.
    if (
      !isProductLinkPath &&
      currentView !== 'product-detail' &&
      currentView !== 'product-learning'
    ) {
      return
    }

    const findAndNavigate = async () => {
      // Build the canonical product link from the LIVE URL
      const productQuery = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      productQuery.set('product', slug)

      if (products.length === 0) {
        try {
          const { productService } = await import('@/lib/data-service')
          const prods = await productService.list({ active: true })
          // Abort if the user navigated elsewhere while the fetch was in
          // flight — otherwise this stale closure would yank them back to
          // the product page after they left it.
          if (typeof window === 'undefined') return
          const liveSlug = new URLSearchParams(window.location.search).get('product')
          if (liveSlug !== slug) return
          setProducts(prods)
          const found = prods.find(p => matchesProductSlug(p, slug))
          if (found) {
            setSelectedProductId(found.id)
            if (currentView !== 'product-detail' && currentView !== 'product-learning') {
              navigateTo('product-detail', productQuery.toString())
            }
          }
        } catch { /* ignore */ }
      } else {
        const found = products.find(p => matchesProductSlug(p, slug))
        if (found) {
          setSelectedProductId(found.id)
          if (currentView !== 'product-detail' && currentView !== 'product-learning') {
            navigateTo('product-detail', productQuery.toString())
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
  useEffect(() => {
    const handlePopState = () => {
      const view = pathToView(window.location.pathname)
      useAppStore.setState({ currentView: view, previousView: null })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle initial page load — sync view from URL
  useEffect(() => {
    const view = pathToView(window.location.pathname)
    const currentView = useAppStore.getState().currentView
    if (currentView !== view) {
      useAppStore.setState({ currentView: view, previousView: null })
    }
    window.history.replaceState({ view }, '', window.location.pathname + window.location.search)
  }, [])

  return null
}

// ─── View Renderer ──────────────────────────────────────────
function ViewRenderer() {
  const currentView = useAppStore(s => s.currentView)
  const showNavbar = !HIDE_NAVBAR_VIEWS.includes(currentView)

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
      case 'subscriptions':
        return <ProfilePage />
      case 'admin-dashboard':
      case 'admin-products':
      case 'admin-users':
      case 'admin-campaigns':
      case 'admin-qr':
      case 'admin-orders':
      case 'admin-invoices':
      case 'admin-analytics':
      case 'admin-content':
      case 'admin-subscriptions':
      case 'admin-learning':
        return <AdminPanel />
      case 'policy-terms':
      case 'policy-privacy':
      case 'policy-shipping':
      case 'policy-refund':
      case 'policy-grievance':
      case 'policy-about':
      case 'policy-contact':
        return <PolicyPage />
      case 'qa-report':
        return <QATestReport />
      default:
        return <LandingPageComponent />
    }
  }

  return (
    <>
      {/* Shared Navbar — visible on all pages except admin */}
      {showNavbar && <AppNavbar />}

      {/* Content area with top padding for fixed navbar */}
      <div className={showNavbar ? 'pt-[72px]' : ''}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
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
