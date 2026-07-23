'use client'

import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'

// ─── View Components ────────────────────────────────────────
import LandingPageComponent from '@/components/LandingPage'
import { OurJourneyPage } from '@/components/OurJourneyPage'
import { AuthLogin, AuthRegister } from '@/components/AuthPages'
import { ProfilePage } from '@/components/ProfilePage'
import ProductDetailPage from '@/components/ProductDetailPage'
import { ProductLearningModule } from '@/components/ProductLearningModule'
import AdminPanel from '@/components/AdminPanel'
import ProductPage from '@/components/ProductPage'

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
      case 'profile':
        return <ProfilePage />
      case 'admin-dashboard':
      case 'admin-products':
      case 'admin-users':
      case 'admin-campaigns':
      case 'admin-learning':
        return <AdminPanel />
      default:
        return <LandingPageComponent />
    }
  }

  return (
    <AnimatePresence mode="wait">
      {renderView()}
    </AnimatePresence>
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
