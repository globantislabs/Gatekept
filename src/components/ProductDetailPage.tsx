'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProductImage from '@/components/ProductImage'
import {
  ArrowLeft, Play, CheckCircle, Lock, Unlock, Share2, Copy, Link2, Package,
  ChevronRight, Home, GraduationCap, RefreshCw, ShieldCheck, Truck,
  Leaf, Clock, Globe, Mail, MessageCircle, Smartphone, ShoppingCart,
  Minus, Plus, CreditCard, BookOpen, Star, AlertTriangle, Info,
  Sparkles, Eye, EyeOff, Repeat, FastForward, RotateCcw
} from 'lucide-react'
import SiteFooter from '@/components/SiteFooter'
import { useAppStore, type CartItem } from '@/store/app-store'
import {
  productService, productLearningService
} from '@/lib/data-service'
import type {
  Product, ProductVideo, ProductQuiz, ProductLearningProgress
} from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// ─── Brand Constants ────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
}

// ─── Animation Variants ─────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
}

// ─── Helper: Parse Highlights ───────────────────────────────
function parseHighlights(highlights: string | null | undefined): string[] {
  if (!highlights) return []
  return highlights.split(',').map(h => h.trim()).filter(Boolean)
}

// ─── Helper: Parse Ingredients ──────────────────────────────
function parseIngredients(ingredients: string | null | undefined): string[] {
  if (!ingredients) return []
  return ingredients.split(',').map(i => i.trim()).filter(Boolean)
}

// ─── Helper: Discount Calculation ───────────────────────────
function calculateDiscount(price: number, mrp: number | null | undefined): { discountPercent: number; savings: number } | null {
  if (!mrp || mrp <= price) return null
  const savings = mrp - price
  const discountPercent = Math.round((savings / mrp) * 100)
  return { discountPercent, savings }
}

// ─── Helper: Video Progress Percentage ──────────────────────
function getVideoProgressPercent(progress: ProductLearningProgress | null): number {
  if (!progress) return 0
  const vp = progress.video_progress
  const total = Object.keys(vp).length
  if (total === 0) return 0
  const watched = Object.values(vp).reduce((sum, pct) => sum + (pct >= 0.9 ? 1 : 0), 0)
  return Math.round((watched / total) * 100)
}

// ─── Helper: Learning Status ────────────────────────────────
type LearningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

function getLearningStatus(progress: ProductLearningProgress | null): LearningStatus {
  if (!progress) return 'NOT_STARTED'
  return progress.status as LearningStatus
}

// ─── Product Detail Page ────────────────────────────────────
export default function ProductDetailPage() {
  const {
    user, selectedProductId, navigateTo, goBack,
    setSelectedProductId, setRedirectAfterLogin,
    addToCart, setShareSlug, shareSlug, completedProductIds,
    skippedProductIds, markProductSkipped, unmarkProductSkipped, markProductCompleted,
    products: cachedProducts, setProducts
  } = useAppStore()

  // State
  const [product, setProduct] = useState<(Product & { videos: ProductVideo[]; quizzes: ProductQuiz[] }) | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchedId, setFetchedId] = useState<string | null>(null)
  const [productProgress, setProductProgress] = useState<ProductLearningProgress | null>(null)
  const [copied, setCopied] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [descExpanded, setDescExpanded] = useState(false)
  const [progressFetchKey, setProgressFetchKey] = useState(0)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

  // Derived: are we currently loading?
  // Use cached product for immediate display — only show loading if we don't have any data at all
  const cachedProduct = cachedProducts.find(p => p.id === selectedProductId)
  const isLoading = !selectedProductId || (!cachedProduct && !product && !fetchError)

  // Display product — use fetched product, fallback to cached product for immediate display
  const displayProduct = product || (cachedProduct ? { ...cachedProduct, videos: [] as ProductVideo[], quizzes: [] as ProductQuiz[] } : null)

  // Derived: share URL computed from product (safe for SSR)
  const shareUrl = useMemo(() => {
    if (!product) return ''
    if (typeof window === 'undefined') return ''
    const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `${window.location.origin}${window.location.pathname}?product=${slug}`
  }, [product])

  // Fetch product data when selectedProductId changes
  useEffect(() => {
    if (!selectedProductId) return

    // Skip if we already fetched this exact product ID
    if (fetchedId === selectedProductId) return

    productService.get(selectedProductId)
      .then(data => {
        setProduct(data)
        const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        setShareSlug(slug)
        setFetchError(null)
        setFetchedId(selectedProductId)
      })
      .catch(err => {
        setFetchError(err.message || 'Failed to load product')
        setProduct(null)
      })
  }, [selectedProductId, fetchedId, setShareSlug])

  // Sync URL with product slug for shareable links (external DOM update)
  useEffect(() => {
    if (!product) return
    const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const url = new URL(window.location.href)
    if (url.searchParams.get('product') !== slug) {
      url.searchParams.set('product', slug)
      window.history.replaceState({}, '', url.toString())
    }
  }, [product?.id])

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      const url = new URL(window.location.href)
      if (url.searchParams.has('product')) {
        url.searchParams.delete('product')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [])

  // Timeout redirect: if no product ID after 1 second, redirect to products page
  useEffect(() => {
    if (selectedProductId) return
    const timer = setTimeout(() => {
      if (!selectedProductId) {
        navigateTo('products')
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [selectedProductId, navigateTo])

  // Fetch learning progress for logged-in user (re-fetch when progressFetchKey changes)
  // Uses a cancelled flag to prevent stale data from a previous product overwriting current product's progress
  useEffect(() => {
    if (!user || !selectedProductId) return
    let cancelled = false
    productLearningService.get(user.id, selectedProductId)
      .then(data => {
        if (cancelled) return
        // Only set progress that matches this specific product
        const prog = data.find(p => p.product_id === selectedProductId)
        setProductProgress(prog || null)
      })
      .catch(() => {
        // Silently fail — progress fetch is non-critical
      })
    return () => { cancelled = true }
  }, [user, selectedProductId, progressFetchKey])

  // Learning status
  const learningStatus = getLearningStatus(productProgress)
  const activeLearningVideoCount = product ? product.videos.filter(v => v.active !== false).length : null
  const noLearningRequired = activeLearningVideoCount === 0
  const isSkipped = selectedProductId ? skippedProductIds.includes(selectedProductId) : false
  const isCompleted = noLearningRequired || isSkipped || learningStatus === 'COMPLETED' || (selectedProductId ? completedProductIds.includes(selectedProductId) : false)
  const isInProgress = learningStatus === 'IN_PROGRESS'
  const videoProgressPct = getVideoProgressPercent(productProgress)

  // Discount
  const discountInfo = displayProduct ? calculateDiscount(displayProduct.price, displayProduct.mrp) : null

  // Highlights & ingredients
  const highlights = displayProduct ? parseHighlights(displayProduct.highlights) : []

  // Gallery images: combine main image + gallery_images (comma-separated)
  const allImages = displayProduct ? [
    displayProduct.image_url,
    ...(displayProduct.gallery_images ? displayProduct.gallery_images.split(',').map(u => u.trim()).filter(Boolean) : []),
  ].filter(Boolean) as string[] : []
  const activeImage = allImages[selectedImageIdx] || displayProduct?.image_url
  const ingredientsList = displayProduct ? parseIngredients(displayProduct.ingredients) : []

  // ─── Handlers ─────────────────────────────────────────────
  // Buy Now — adds product to cart and redirects to cart page.
  // LOCKED until the user is logged in AND has completed the learning module.
  const handleAddToCart = () => {
    if (!user) {
      // Not logged in — send to login, return here after
      if (!product) return
      setSelectedProductId(product.id)
      setRedirectAfterLogin('product-detail')
      navigateTo('auth-login')
      return
    }
    if (!isCompleted) {
      // Logged in but learning not completed — start learning
      if (!product) return
      setSelectedProductId(product.id)
      navigateTo('product-learning')
      return
    }
    const activeProduct = displayProduct || product
    if (!activeProduct) return
    addToCart({
      productId: activeProduct.id,
      name: activeProduct.name,
      price: activeProduct.price,
      quantity,
      imageUrl: activeProduct.image_url,
      type: activeProduct.type,
      purchaseType: 'one-time',
    })
    toast.success(`${activeProduct.name} added to cart!`)
    navigateTo('cart')
  }

  const handleSubscribe = () => {
    const activeProduct = displayProduct || product
    if (!activeProduct || !isCompleted) return
    addToCart({
      productId: activeProduct.id,
      name: activeProduct.name,
      price: activeProduct.price,
      quantity,
      imageUrl: activeProduct.image_url,
      type: activeProduct.type,
      purchaseType: 'subscription',
    })
    toast.success(`${activeProduct.name} subscription added to cart!`)
    navigateTo('cart')
  }

  const handleStartLearning = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    if (!user) {
      // Require login before starting learning — redirect back to product detail after login
      setRedirectAfterLogin('product-detail')
      navigateTo('auth-login')
    } else {
      navigateTo('product-learning')
    }
  }, [product, user, setSelectedProductId, setRedirectAfterLogin, navigateTo])

  const handleLoginToSave = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    setRedirectAfterLogin('product-detail')
    navigateTo('auth-login')
  }, [product, setSelectedProductId, setRedirectAfterLogin, navigateTo])

  const handleContinueLearning = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    navigateTo('product-learning')
  }, [product, setSelectedProductId, navigateTo])

  const handleReview = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    navigateTo('product-learning')
  }, [product, setSelectedProductId, navigateTo])

  const goToProductsPage = useCallback(() => {
    window.location.href = 'https://notjustwatr.com/products'
  }, [])

  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }, [shareUrl])

  const handleNativeShare = useCallback(async () => {
    if (!shareUrl || !product) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on NOTJUST Watr!`,
          url: shareUrl
        })
      } catch {
        // User cancelled or failed — fall back to copy
        await handleCopyShareLink()
      }
    } else {
      await handleCopyShareLink()
    }
  }, [shareUrl, product, handleCopyShareLink])

  // ─── Loading State ────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: BRAND.green }} />
          <p className="text-sm" style={{ color: BRAND.muted }}>Loading product details...</p>
        </motion.div>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────
  if (fetchError || (!isLoading && !displayProduct)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center p-8"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `${BRAND.surface}50` }}>
            <Package className="w-10 h-10" style={{ color: BRAND.muted }} />
          </div>
          <h2 className="font-heading text-xl font-bold" style={{ color: BRAND.dark }}>
            {fetchError || 'Product not found'}
          </h2>
          <p className="text-sm" style={{ color: BRAND.muted }}>
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={goToProductsPage}
              className="min-h-[44px] rounded-xl font-heading font-semibold"
              style={{ backgroundColor: BRAND.green, color: '#fff' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateTo('landing')}
              className="min-h-[44px] rounded-xl font-heading font-semibold border-[#e3dfd8]"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Main Render ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f0] pt-4 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* ─── Navigation ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-4 sm:mb-6 gap-2"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0" style={{ color: BRAND.muted }}>
            <button
              onClick={goToProductsPage}
              className="pointer-events-auto hover:opacity-80 transition-opacity font-medium cursor-pointer"
              style={{ color: BRAND.green }}
            >
              Products
            </button>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium truncate" style={{ color: BRAND.dark }}>{displayProduct?.name || 'Product'}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={goToProductsPage}
              className="pointer-events-auto min-h-[36px] sm:min-h-[44px] rounded-xl border-[#e3dfd8] font-heading text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="sm:inline">Products</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('landing')}
              className="pointer-events-auto min-h-[36px] sm:min-h-[44px] rounded-xl border-[#e3dfd8] font-heading text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="sm:inline">Home</span>
            </Button>
          </div>
        </motion.div>

        {/* ─── Product Overview Section ────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">

            {/* Left: Product Image + About/Overview below */}
            <motion.div variants={staggerItem} className="space-y-4 sm:space-y-5">
              <div className="relative h-[260px] sm:h-[340px] lg:h-[440px] rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center border"
                style={{ borderColor: BRAND.surface, backgroundColor: `${BRAND.surface}30` }}
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#e3dfd8]/20 to-[#f4f3f0]" />

                {/* Product image */}
                <ProductImage
                  src={activeImage}
                  alt={displayProduct?.name || 'Product'}
                  productType={displayProduct?.type}
                  fill
                  className="object-contain object-center relative z-10"
                  priority
                />

                {/* Badges on image */}
                <Badge
                  className="pointer-events-auto absolute top-3 right-3 z-20 text-xs shadow-md min-h-[28px]"
                  style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                >
                  {displayProduct?.type}
                </Badge>

                {displayProduct?.category && (
                  <Badge
                    className="pointer-events-auto absolute top-3 left-12 z-20 text-xs shadow-md min-h-[28px]"
                    style={{ backgroundColor: BRAND.lime, color: BRAND.dark, borderColor: 'transparent' }}
                  >
                    {displayProduct.category}
                  </Badge>
                )}

                {displayProduct?.discount_label && (
                  <Badge
                    className="pointer-events-auto absolute bottom-3 left-3 z-20 text-xs shadow-md min-h-[28px]"
                    style={{ backgroundColor: '#e7b973', color: BRAND.dark, borderColor: 'transparent' }}
                  >
                    {displayProduct.discount_label}
                  </Badge>
                )}

                {/* Completed overlay badge */}
                {isCompleted && (
                  <div className="pointer-events-auto absolute bottom-3 right-3 z-20">
                    <Badge
                      className="text-xs shadow-lg min-h-[28px] px-3"
                      style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
              </div>

              {/* ─── Gallery Thumbnails (Amazon-style) ─── */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImageIdx === idx ? 'border-[#48805b] shadow-md' : 'border-[#e3dfd8] hover:border-[#48805b]/40'
                      }`}
                      style={{ backgroundColor: `${BRAND.surface}30` }}
                    >
                      <ProductImage
                        src={img}
                        alt={`Gallery ${idx + 1}`}
                        productType={displayProduct?.type}
                        fill
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Product Details Tabs (below image on left) ──── */}
              <Tabs defaultValue="overview" className="w-full">

                {/* Scrollable Tabs List */}
                <TabsList
                  className="w-full h-auto p-0 bg-transparent rounded-none border-b flex items-stretch gap-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden"
                  style={{ borderColor: BRAND.surface, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {[
                    { value: 'overview', label: 'Overview', mobileLabel: 'Info', icon: <Info className="w-3.5 h-3.5 hidden sm:block" /> },
                    { value: 'ingredients', label: 'Ingredients', mobileLabel: 'Ingr.', icon: <Leaf className="w-3.5 h-3.5 hidden sm:block" /> },
                    { value: 'nutrition', label: 'Nutrition', mobileLabel: 'Nutri.', icon: <Package className="w-3.5 h-3.5 hidden sm:block" /> },
                    { value: 'storage', label: 'Storage', mobileLabel: 'Store', icon: <ShieldCheck className="w-3.5 h-3.5 hidden sm:block" /> },
                    { value: 'legal', label: 'Legal', mobileLabel: 'Legal', icon: <Globe className="w-3.5 h-3.5 hidden sm:block" /> },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="pointer-events-auto min-h-[40px] px-3 py-1.5 text-[11px] sm:text-xs font-heading font-medium transition-all border-b-2 -mb-px rounded-none data-[state=active]:border-b-2 data-[state=active]:shadow-none whitespace-nowrap flex-shrink-0"
                      style={{
                        borderColor: 'transparent',
                        color: BRAND.muted,
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ─── Overview Tab ──────────────────────────────── */}
                <TabsContent value="overview" className="mt-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {highlights.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <h4 className="font-heading font-semibold text-xs" style={{ color: BRAND.dark }}>
                            Key Highlights
                          </h4>
                          {highlights.map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BRAND.green }} />
                              <span className="text-xs" style={{ color: BRAND.dark }}>{h}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Product Details Grid */}
                      <div className="space-y-2">
                        <h3 className="font-heading font-bold text-sm" style={{ color: BRAND.dark }}>
                          Product Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { label: 'Weight', value: displayProduct?.weight, icon: <Package className="w-3.5 h-3.5" /> },
                            { label: 'Serving Size', value: displayProduct?.serving_size, icon: <Leaf className="w-3.5 h-3.5" /> },
                            { label: 'SKU', value: displayProduct?.sku, icon: <Info className="w-3.5 h-3.5" /> },
                            { label: 'Type', value: displayProduct?.type, icon: <Package className="w-3.5 h-3.5" /> },
                          ].filter(d => d.value).map((d, i) => (
                            <motion.div
                              key={d.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="p-2 rounded-lg bg-white border"
                              style={{ borderColor: BRAND.surface }}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                {d.icon}
                                <p className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.muted }}>{d.label}</p>
                              </div>
                              <p className="text-xs font-medium" style={{ color: d.value ? BRAND.dark : BRAND.muted }}>
                                {d.value || 'Not available'}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* ─── Ingredients Tab ────────────────────────────── */}
                <TabsContent value="ingredients" className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="ingredients"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {ingredientsList.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                            Ingredients
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {ingredientsList.map((ing, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: `${BRAND.green}08`,
                                  color: BRAND.green,
                                  borderColor: `${BRAND.green}18`
                                }}
                              >
                                {ing}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          No ingredient information available.
                        </p>
                      )}

                      {displayProduct?.allergen_info && (
                        <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                          <h4 className="font-heading font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: BRAND.dark }}>
                            <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
                            Allergen Information
                          </h4>
                          <p className="text-sm" style={{ color: BRAND.muted }}>
                            {displayProduct.allergen_info}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* ─── Nutrition Tab ──────────────────────────────── */}
                <TabsContent value="nutrition" className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="nutrition"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {displayProduct?.nutrition_info ? (
                        <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                          <h3 className="font-heading font-bold text-lg mb-3" style={{ color: BRAND.dark }}>
                            Nutrition Information
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                            {displayProduct.nutrition_info}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          No nutrition information available.
                        </p>
                      )}

                      {displayProduct?.serving_size && (
                        <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                          <h4 className="font-heading font-semibold text-sm mb-2" style={{ color: BRAND.dark }}>
                            Serving Size
                          </h4>
                          <p className="text-sm" style={{ color: BRAND.muted }}>
                            {displayProduct.serving_size}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* ─── Storage Tab ────────────────────────────────── */}
                <TabsContent value="storage" className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="storage"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {displayProduct?.storage_info ? (
                        <div className="p-4 rounded-xl bg-white border flex items-start gap-3"
                          style={{ borderColor: BRAND.surface }}
                        >
                          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.green }} />
                          <div>
                            <h4 className="font-heading font-semibold text-sm mb-1" style={{ color: BRAND.dark }}>
                              Storage Instructions
                            </h4>
                            <p className="text-sm" style={{ color: BRAND.muted }}>
                              {displayProduct.storage_info}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          No storage information available.
                        </p>
                      )}

                      {displayProduct?.shelf_life && (
                        <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                          <h4 className="font-heading font-semibold text-sm mb-2" style={{ color: BRAND.dark }}>
                            Shelf Life
                          </h4>
                          <p className="text-sm" style={{ color: BRAND.muted }}>
                            {displayProduct.shelf_life}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                {/* ─── Legal Tab ───────────────────────────────────── */}
                <TabsContent value="legal" className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="legal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {[
                          { label: 'FSSAI License', value: displayProduct?.fssai_license, icon: <ShieldCheck className="w-4 h-4" /> },
                          { label: 'HSN Code', value: displayProduct?.hsn_code, icon: <Package className="w-4 h-4" /> },
                          { label: 'GST Rate', value: displayProduct?.gst_rate, icon: <Info className="w-4 h-4" /> },
                          { label: 'Country of Origin', value: displayProduct?.country_origin, icon: <Globe className="w-4 h-4" /> },
                        ].filter(d => d.value).map((d, i) => (
                          <motion.div
                            key={d.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl bg-white border"
                            style={{ borderColor: BRAND.surface }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {d.icon}
                              <p className="text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>{d.label}</p>
                            </div>
                            <p className="text-sm font-medium" style={{ color: BRAND.dark }}>
                              {d.value || 'Not available'}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* Right: Product Info — Price, Badges, CTA, Learning Module, Trust */}
            <motion.div variants={staggerItem} className="space-y-5 sm:space-y-6 lg:sticky lg:top-20 self-start">
              {/* Name & Short Description */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: BRAND.dark }}>
                    {displayProduct?.name}
                  </h1>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNativeShare}
                    className="pointer-events-auto min-h-[40px] min-w-[40px] rounded-lg border flex-shrink-0"
                    style={{ borderColor: BRAND.surface }}
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" style={{ color: BRAND.muted }} />
                  </Button>
                </div>
                {displayProduct?.short_description && (
                  <p className="leading-relaxed text-sm sm:text-base" style={{ color: BRAND.muted }}>
                    {displayProduct.short_description}
                  </p>
                )}
              </div>

              {/* About This Product — right side */}
              {displayProduct?.description && (() => {
                const desc = displayProduct.description
                const isLong = desc.length > 300
                const visibleText = (!descExpanded && isLong) ? desc.slice(0, 300) : desc
                return (
                  <div className="space-y-2">
                    <h3 className="font-heading font-semibold text-sm" style={{ color: BRAND.dark }}>
                      About This Product
                    </h3>
                    <p className="leading-relaxed text-sm whitespace-pre-line" style={{ color: BRAND.muted }}>
                      {visibleText}{!descExpanded && isLong ? '...' : ''}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-xs font-medium hover:underline inline-flex items-center gap-1"
                        style={{ color: BRAND.green }}
                      >
                        {descExpanded ? (
                          <>View Less <ChevronRight className="w-3 h-3 rotate-90" /></>
                        ) : (
                          <>View More <ChevronRight className="w-3 h-3 -rotate-90" /></>
                        )}
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* Highlights — right side */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.slice(0, 6).map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="pointer-events-auto px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${BRAND.green}08`,
                        color: BRAND.green,
                        borderColor: `${BRAND.green}18`
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1 inline" />
                      {h}
                    </motion.span>
                  ))}
                </div>
              )}

              <Separator style={{ backgroundColor: BRAND.surface }} />

              {/* ─── Price + Discount ──────────────────────────── */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-heading text-2xl sm:text-3xl font-bold" style={{ color: BRAND.green }}>
                  ₹{displayProduct?.price.toLocaleString()}
                </span>
                {discountInfo && (
                  <>
                    <span className="text-base line-through" style={{ color: BRAND.muted }}>
                      ₹{(displayProduct?.mrp ?? 0).toLocaleString()}
                    </span>
                    <Badge
                      className="text-[11px] min-h-[22px] px-2.5"
                      style={{ backgroundColor: '#e7b97320', color: '#b56b20', borderColor: '#e7b97330' }}
                    >
                      {discountInfo.discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* ─── Type & Category Badges ────────────────────── */}
              <div className="flex flex-wrap gap-2">
                {displayProduct?.type && (
                  <Badge
                    className="min-h-[28px] px-3 text-xs font-medium"
                    style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                  >
                    {displayProduct.type === 'FIZZ' ? '🫧 FIZZ' : displayProduct.type}
                  </Badge>
                )}
                {displayProduct?.category && (
                  <Badge
                    className="min-h-[28px] px-3 text-xs font-medium"
                    style={{ backgroundColor: `${BRAND.lime}20`, color: BRAND.dark, borderColor: `${BRAND.lime}30` }}
                  >
                    {displayProduct.category}
                  </Badge>
                )}
                {displayProduct?.discount_label && (
                  <Badge
                    className="min-h-[28px] px-3 text-xs font-medium"
                    style={{ backgroundColor: '#e7b97320', color: '#b56b20', borderColor: '#e7b97330' }}
                  >
                    {displayProduct.discount_label}
                  </Badge>
                )}
              </div>

              {/* ─── Buy Now + Unlock Now Buttons ──────────────── */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Buy Now — locked until logged in + learning completed */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!user || !isCompleted}
                  className="pointer-events-auto min-h-[48px] flex-1 rounded-xl font-heading font-semibold text-base transition-colors cursor-pointer touch-manipulation select-none disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: BRAND.green,
                    color: '#fff',
                    borderColor: 'transparent',
                    cursor: (!user || !isCompleted) ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  title={!user ? 'Please log in to unlock Buy Now' : (!isCompleted ? 'Complete the learning module to unlock Buy Now' : undefined)}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
                </Button>

                {/* Unlock Now — Starts learning module */}
                <Button
                  onClick={isCompleted ? handleReview : (user ? handleStartLearning : handleLoginToSave)}
                  className="pointer-events-auto min-h-[48px] rounded-xl font-heading font-semibold text-base transition-colors cursor-pointer touch-manipulation select-none"
                  style={{
                    backgroundColor: isCompleted ? `${BRAND.lime}20` : BRAND.lime,
                    color: isCompleted ? BRAND.green : BRAND.dark,
                    borderColor: isCompleted ? `${BRAND.lime}30` : 'transparent',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Unlocked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock Now
                    </>
                  )}
                </Button>
              </div>

              {/* ─── Learning Module Card ───────────────────────── */}
              {!noLearningRequired && <Card className="border rounded-2xl overflow-hidden" style={{ borderColor: BRAND.surface }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${BRAND.green}12` }}>
                      <GraduationCap className="w-5 h-5" style={{ color: BRAND.green }} />
                    </div>
                    <div>
                      <CardTitle className="font-heading text-base font-semibold leading-tight" style={{ color: BRAND.dark }}>
                        Learn before you Buy
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-0">

                  {/* Video & Quiz count info */}
                  {displayProduct?.videos && displayProduct.videos.length > 0 && (
                    <div className="flex items-center gap-4 text-xs px-6 pt-4" style={{ color: BRAND.muted }}>
                      <span className="flex items-center gap-1">
                        <Play className="w-3.5 h-3.5" />
                        {displayProduct.videos.length} videos
                      </span>
                      {displayProduct.quizzes && displayProduct.quizzes.length > 0 && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {displayProduct.quizzes.length} quiz questions
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ~10 min
                      </span>
                    </div>
                  )}

                  {/* Progress display if user has progress */}
                  {user && productProgress && (isInProgress || isCompleted) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3 px-6"
                    >
                      {/* Video Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: BRAND.muted }}>Video Progress</span>
                          <span className="font-medium" style={{ color: BRAND.green }}>{videoProgressPct}%</span>
                        </div>
                        <Progress
                          value={videoProgressPct}
                          className="h-2 rounded-full"
                          style={{ backgroundColor: `${BRAND.surface}60` }}
                        />
                      </div>

                      {/* Quiz Score */}
                      {productProgress.quiz_completed && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg"
                          style={{ backgroundColor: isCompleted ? `${BRAND.green}08` : `${BRAND.lime}08` }}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" style={{ color: BRAND.green }} />
                          ) : (
                            <Star className="w-4 h-4" style={{ color: BRAND.lime }} />
                          )}
                          <span className="text-sm font-medium" style={{ color: BRAND.dark }}>
                            Quiz Score: {productProgress.quiz_score}%
                          </span>
                          {isCompleted && (
                            <Badge className="text-[10px] ml-auto min-h-[20px]"
                              style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                            >
                              Passed
                            </Badge>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── Action Button (sign/learn) ──────────────── */}
                    <div className="px-6">
                      {!user ? (
                        <Button
                          onClick={handleLoginToSave}
                          className="pointer-events-auto min-h-[48px] w-full rounded-xl font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer touch-manipulation select-none"
                          style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent', WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="sm:hidden">Sign in to Learn & Buy</span>
                          <span className="hidden sm:inline">Sign in to access product learning & enable purchase</span>
                        </Button>
                      ) : learningStatus === 'NOT_STARTED' && !isSkipped ? (
                        <Button
                          onClick={handleStartLearning}
                          className="pointer-events-auto min-h-[48px] w-full rounded-xl font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer touch-manipulation select-none"
                          style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent', WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="sm:hidden">Start Learning</span>
                          <span className="hidden sm:inline">Start the learning module to unlock purchase</span>
                        </Button>
                      ) : isInProgress && !isSkipped ? (
                        <Button
                          onClick={handleContinueLearning}
                          className="pointer-events-auto min-h-[48px] w-full rounded-xl font-heading font-semibold text-xs sm:text-sm transition-colors cursor-pointer touch-manipulation select-none"
                          style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent', WebkitTapHighlightColor: 'transparent' }}
                        >
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="sm:hidden">Continue Learning</span>
                          <span className="hidden sm:inline">Continue Learning to Unlock Purchase</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={handleReview}
                          variant="outline"
                          className="pointer-events-auto min-h-[48px] w-full rounded-xl font-heading font-semibold text-xs sm:text-sm border-[#e3dfd8] transition-colors cursor-pointer touch-manipulation select-none"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          Review Learning Module & Videos
                        </Button>
                      )}

                      {/* Skip / Unskip Learning Action Buttons */}
                      {user && (
                        <div className="mt-3 pt-2 border-t flex flex-col items-center gap-2" style={{ borderColor: BRAND.surface }}>
                          {isSkipped ? (
                            <div className="flex items-center justify-between w-full p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/20">
                              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: BRAND.dark }}>
                                <FastForward className="w-3.5 h-3.5 text-amber-600" />
                                Learning Skipped (Unlocked)
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (selectedProductId) {
                                    unmarkProductSkipped(selectedProductId)
                                    toast.info('Learning requirement restored')
                                  }
                                }}
                                className="h-7 text-xs px-2.5 border-amber-500/30 hover:bg-amber-500/15 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Unskip
                              </Button>
                            </div>
                          ) : !isCompleted ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedProductId) {
                                  markProductSkipped(selectedProductId)
                                  markProductCompleted(selectedProductId)
                                  toast.success('Learning skipped! Product unlocked.')
                                }
                              }}
                              className="pointer-events-auto w-full min-h-[36px] rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              style={{ color: BRAND.muted }}
                            >
                              <FastForward className="w-3.5 h-3.5" style={{ color: BRAND.green }} />
                              Skip Learning & Unlock Instantly
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedProductId) {
                                  markProductSkipped(selectedProductId)
                                  toast.success('Learning status set to skipped')
                                }
                              }}
                              className="pointer-events-auto text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
                              style={{ color: BRAND.muted }}
                            >
                              <FastForward className="w-3 h-3" />
                              Skip Learning Mode
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                  {/* ─── Bottom: Sign to access note ────── */}
                  {!user && (
                    <div className="px-6 pt-2 pb-4">
                      <p className="text-xs text-center" style={{ color: BRAND.muted }}>
                        <Lock className="w-3 h-3 inline mr-1" />
                        Sign in to access product learning & enable purchase
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>}

              {/* ─── Trust Badges ─────────────────────────────── */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mb-1" style={{ color: BRAND.green }} />
                  <p className="text-[9px] sm:text-[10px] font-medium" style={{ color: BRAND.dark }}>FSSAI Certified</p>
                  <p className="text-[8px] sm:text-[9px]" style={{ color: BRAND.muted }}>{displayProduct?.fssai_license || 'Licensed'}</p>
                </div>
                <div className="flex flex-col items-center text-center p-2 sm:p-3 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 mb-1" style={{ color: BRAND.green }} />
                  <p className="text-[9px] sm:text-[10px] font-medium" style={{ color: BRAND.dark }}>Free Shipping</p>
                  <p className="text-[8px] sm:text-[9px]" style={{ color: BRAND.muted }}>Pan India</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── Contact Section ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mt-12 lg:mt-16"
        >
          <Card className="border rounded-2xl" style={{ borderColor: BRAND.surface }}>
            <CardHeader>
              <CardTitle className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: BRAND.dark }}>
                <MessageCircle className="w-5 h-5" style={{ color: BRAND.green }} />
                Need Help? Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[44px] touch-manipulation select-none cursor-pointer"
                  style={{ backgroundColor: '#25D36608', borderColor: '#25D36620', border: '1px solid #25D36620', WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => window.open('https://wa.me/919288007431?text=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[40px]"
                    style={{ backgroundColor: '#25D36615' }}
                  >
                    <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>WhatsApp</p>
                    <p className="text-[11px]" style={{ color: BRAND.muted }}>Chat with us instantly</p>
                  </div>
                </button>

                <button
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[44px] touch-manipulation select-none cursor-pointer"
                  style={{ backgroundColor: `${BRAND.blue}08`, borderColor: `${BRAND.blue}20`, border: `1px solid ${BRAND.blue}20`, WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => window.open('mailto:info@zh-onehealth.com?subject=Query%20about%20NOTJUST%20Watr', '_blank')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[40px]"
                    style={{ backgroundColor: `${BRAND.blue}15` }}
                  >
                    <Mail className="w-5 h-5" style={{ color: BRAND.blue }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>Email</p>
                    <p className="text-[11px]" style={{ color: BRAND.muted }}>info@zh-onehealth.com</p>
                  </div>
                </button>

                <button
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-colors min-h-[44px] touch-manipulation select-none cursor-pointer"
                  style={{ backgroundColor: `${BRAND.green}08`, borderColor: `${BRAND.green}20`, border: `1px solid ${BRAND.green}20`, WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => window.open('sms:+919288007431?body=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[40px]"
                    style={{ backgroundColor: `${BRAND.green}15` }}
                  >
                    <Smartphone className="w-5 h-5" style={{ color: BRAND.green }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>SMS</p>
                    <p className="text-[11px]" style={{ color: BRAND.muted }}>+91 92880 07431</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
      {/* Spacer so the footer never sits flush against the content */}
      <div className="h-10 sm:h-16" aria-hidden="true" />
      <SiteFooter />
    </div>
  )
}
