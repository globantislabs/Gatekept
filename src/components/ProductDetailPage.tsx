'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, CheckCircle, Lock, Share2, Copy, Link2, Package,
  ChevronRight, Home, GraduationCap, RefreshCw, ShieldCheck, Truck,
  Leaf, Clock, Globe, Mail, MessageCircle, Smartphone, ShoppingCart,
  Minus, Plus, CreditCard, BookOpen, Star, AlertTriangle, Info,
  Sparkles, Eye, EyeOff, SeparatorHorizontal
} from 'lucide-react'
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
    addToCart, setShareSlug, shareSlug,
    products: cachedProducts, setProducts
  } = useAppStore()

  // State
  const [product, setProduct] = useState<(Product & { videos: ProductVideo[]; quizzes: ProductQuiz[] }) | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchedId, setFetchedId] = useState<string | null>(null)
  const [productProgress, setProductProgress] = useState<ProductLearningProgress | null>(null)
  const [copied, setCopied] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [progressFetchKey, setProgressFetchKey] = useState(0)

  // Derived: are we currently loading?
  // Use cached product for immediate display — only show loading if we don't have any data at all
  const cachedProduct = cachedProducts.find(p => p.id === selectedProductId)
  const isLoading = !selectedProductId || (!cachedProduct && !product && !fetchError)

  // Display product — use fetched product, fallback to cached product for immediate display
  const displayProduct = product || (cachedProduct ? { ...cachedProduct, videos: [] as ProductVideo[], quizzes: [] as ProductQuiz[] } : null)

  // Derived: share URL computed from product
  const shareUrl = useMemo(() => {
    if (!product) return ''
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
  useEffect(() => {
    if (!user || !selectedProductId) return
    productLearningService.get(user.id, selectedProductId)
      .then(data => {
        const prog = data.find(p => p.product_id === selectedProductId)
        setProductProgress(prog || null)
      })
      .catch(() => {
        // Silently fail — progress fetch is non-critical
      })
  }, [user, selectedProductId, progressFetchKey])

  // Learning status
  const learningStatus = getLearningStatus(productProgress)
  const isCompleted = learningStatus === 'COMPLETED'
  const isInProgress = learningStatus === 'IN_PROGRESS'
  const videoProgressPct = getVideoProgressPercent(productProgress)

  // Discount
  const discountInfo = displayProduct ? calculateDiscount(displayProduct.price, displayProduct.mrp) : null

  // Highlights & ingredients
  const highlights = displayProduct ? parseHighlights(displayProduct.highlights) : []
  const ingredientsList = displayProduct ? parseIngredients(displayProduct.ingredients) : []

  // ─── Handlers ─────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product || !isCompleted) return
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.image_url,
      type: product.type,
      purchaseType: 'one-time',
    })
    toast.success(`${product.name} added to cart!`, {
      action: {
        label: 'Go to Cart →',
        onClick: () => navigateTo('cart'),
      },
      duration: 5000,
    })
  }, [product, isCompleted, quantity, addToCart, navigateTo])

  const handleStartLearning = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    if (!user) {
      // Require login before starting learning
      setRedirectAfterLogin('product-learning')
      navigateTo('auth-login')
    } else {
      navigateTo('product-learning')
    }
  }, [product, user, setSelectedProductId, setRedirectAfterLogin, navigateTo])

  const handleLoginToSave = useCallback(() => {
    if (!product) return
    setSelectedProductId(product.id)
    setRedirectAfterLogin('product-learning')
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
              onClick={() => navigateTo('products')}
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
    <div className="min-h-screen bg-[#f4f3f0] pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── Navigation ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: BRAND.muted }}>
            <button
              onClick={() => navigateTo('products')}
              className="pointer-events-auto hover:opacity-80 transition-opacity font-medium"
              style={{ color: BRAND.green }}
            >
              Products
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium" style={{ color: BRAND.dark }}>{displayProduct?.name || 'Product'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('products')}
              className="pointer-events-auto min-h-[44px] rounded-xl border-[#e3dfd8] font-heading text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('landing')}
              className="pointer-events-auto min-h-[44px] rounded-xl border-[#e3dfd8] font-heading text-sm"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>
        </motion.div>

        {/* ─── Product Overview Section ────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Left: Product Image */}
            <motion.div variants={staggerItem} className="space-y-4">
              <div className="relative aspect-square rounded-2xl lg:rounded-3xl overflow-hidden flex items-center justify-center border"
                style={{ borderColor: BRAND.surface, backgroundColor: `${BRAND.surface}30` }}
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#e3dfd8]/20 to-[#f4f3f0]" />

                {/* Product image */}
                <Image
                  src={displayProduct?.image_url || (displayProduct?.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')}
                  alt={displayProduct?.name || 'Product'}
                  fill
                  className="object-contain p-8 sm:p-10 lg:p-12 relative z-10"
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

              {/* Highlights strip below image */}
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
            </motion.div>

            {/* Right: Product Info */}
            <motion.div variants={staggerItem} className="space-y-5">
              {/* Name & Short Description */}
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: BRAND.dark }}>
                  {displayProduct?.name}
                </h1>
                {displayProduct?.short_description && (
                  <p className="leading-relaxed text-sm sm:text-base" style={{ color: BRAND.muted }}>
                    {displayProduct.short_description}
                  </p>
                )}
              </div>

              {/* Price Display */}
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: BRAND.green }}>
                  ₹{displayProduct?.price.toLocaleString()}
                </span>
                {discountInfo && (
                  <>
                    <span className="text-lg line-through" style={{ color: BRAND.muted }}>
                      ₹{displayProduct?.mrp!.toLocaleString()}
                    </span>
                    <Badge
                      className="text-xs min-h-[24px]"
                      style={{ backgroundColor: '#e7b97320', color: '#b56b20', borderColor: '#e7b97330' }}
                    >
                      {discountInfo.discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Type & Category Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  className="min-h-[28px] px-3 text-xs font-medium"
                  style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                >
                  {displayProduct?.type === 'FIZZ' ? '🫧 FIZZ' : '💧 STILL'}
                </Badge>
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
                    {displayProduct?.discount_label}
                  </Badge>
                )}
              </div>

              <Separator style={{ backgroundColor: BRAND.surface }} />

              {/* ─── Learning Access Section ─────────────────── */}
              <Card className="border rounded-xl" style={{ borderColor: BRAND.surface }}>
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-base font-semibold flex items-center gap-2" style={{ color: BRAND.dark }}>
                    <GraduationCap className="w-5 h-5" style={{ color: BRAND.green }} />
                    Learning Module
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Progress display if user has progress */}
                  {user && productProgress && (isInProgress || isCompleted) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
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

                  {/* Status-based buttons */}
                  {!user && (
                    <div className="space-y-3">
                      {/* Not logged in: Start Learning requires login */}
                      <p className="text-xs" style={{ color: BRAND.muted }}>
                        Login to start learning and track your progress
                      </p>
                      <Button
                        onClick={handleStartLearning}
                        className="pointer-events-auto min-h-[44px] w-full rounded-xl font-heading font-semibold text-base"
                        style={{ backgroundColor: BRAND.green, color: '#fff' }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Login to Start Learning
                      </Button>
                    </div>
                  )}

                  {user && learningStatus === 'NOT_STARTED' && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleStartLearning}
                        className="pointer-events-auto min-h-[44px] w-full rounded-xl font-heading font-semibold text-base"
                        style={{ backgroundColor: BRAND.green, color: '#fff' }}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Learning Module
                      </Button>
                    </div>
                  )}

                  {user && isInProgress && (
                    <Button
                      onClick={handleContinueLearning}
                      className="pointer-events-auto min-h-[44px] w-full rounded-xl font-heading font-semibold text-base"
                      style={{ backgroundColor: BRAND.green, color: '#fff' }}
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Continue Learning
                    </Button>
                  )}

                  {user && isCompleted && (
                    <div className="space-y-4">
                      {/* Completed badge + Review */}
                      <div className="flex items-center gap-3">
                        <Badge
                          className="min-h-[28px] px-3 text-xs"
                          style={{ backgroundColor: BRAND.green, color: '#fff', borderColor: 'transparent' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Completed
                        </Badge>
                        <Button
                          onClick={handleReview}
                          variant="outline"
                          className="pointer-events-auto min-h-[44px] flex-1 rounded-xl font-heading font-semibold border-[#e3dfd8]"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      </div>

                      {/* Purchase section — unlocked after learning completion */}
                      <div className="p-4 rounded-xl space-y-3"
                        style={{ backgroundColor: `${BRAND.lime}08`, borderColor: `${BRAND.lime}30`, borderWidth: '1px' }}
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" style={{ color: BRAND.lime }} />
                          <span className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
                            Product Unlocked — Now Available for Purchase
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 rounded-lg border" style={{ borderColor: BRAND.surface }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-l-lg"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              <Minus className="w-4 h-4" style={{ color: BRAND.muted }} />
                            </Button>
                            <span className="min-w-[32px] text-center font-medium text-sm" style={{ color: BRAND.dark }}>
                              {quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-r-lg"
                              onClick={() => setQuantity(Math.min(displayProduct?.max_order_qty || 10, quantity + 1))}
                              disabled={quantity >= (displayProduct?.max_order_qty || 10)}
                            >
                              <Plus className="w-4 h-4" style={{ color: BRAND.muted }} />
                            </Button>
                          </div>
                          <Button
                            onClick={handleAddToCart}
                            className="pointer-events-auto min-h-[44px] flex-1 rounded-xl font-heading font-semibold text-base"
                            style={{ backgroundColor: BRAND.lime, color: BRAND.dark }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart — ₹{((displayProduct?.price || 0) * quantity).toLocaleString()}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video & Quiz count info */}
                  {displayProduct?.videos && displayProduct.videos.length > 0 && (
                    <div className="flex items-center gap-4 text-xs pt-1" style={{ color: BRAND.muted }}>
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
                </CardContent>
              </Card>

              <Separator style={{ backgroundColor: BRAND.surface }} />

              {/* ─── Share Section ────────────────────────────── */}
              <Card className="border rounded-xl" style={{ borderColor: BRAND.surface }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" style={{ color: BRAND.green }} />
                    <span className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
                      Share this product
                    </span>
                  </div>

                  {shareUrl && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-xs truncate"
                        style={{ backgroundColor: `${BRAND.surface}40`, color: BRAND.muted }}
                      >
                        {shareUrl}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyShareLink}
                        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border-[#e3dfd8]"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4" style={{ color: BRAND.green }} />
                        ) : (
                          <Copy className="w-4 h-4" style={{ color: BRAND.muted }} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNativeShare}
                        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border-[#e3dfd8]"
                      >
                        <Link2 className="w-4 h-4" style={{ color: BRAND.blue }} />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── Trust Badges ─────────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                  <ShieldCheck className="w-5 h-5 mb-1" style={{ color: BRAND.green }} />
                  <p className="text-[10px] font-medium" style={{ color: BRAND.dark }}>FSSAI Certified</p>
                  <p className="text-[9px]" style={{ color: BRAND.muted }}>{displayProduct?.fssai_license || 'Licensed'}</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                  <Truck className="w-5 h-5 mb-1" style={{ color: BRAND.green }} />
                  <p className="text-[10px] font-medium" style={{ color: BRAND.dark }}>Free Shipping</p>
                  <p className="text-[9px]" style={{ color: BRAND.muted }}>Pan India</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                  <Leaf className="w-5 h-5 mb-1" style={{ color: BRAND.green }} />
                  <p className="text-[10px] font-medium" style={{ color: BRAND.dark }}>100% Natural</p>
                  <p className="text-[9px]" style={{ color: BRAND.muted }}>{displayProduct?.country_origin || 'Made in India'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── Product Details Tabs ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 lg:mt-12"
        >
          <Tabs defaultValue="overview" className="w-full">

            {/* Scrollable Tabs List */}
            <TabsList className="w-full flex overflow-x-auto gap-0 h-auto p-0 bg-transparent rounded-none border-b"
              style={{ borderColor: BRAND.surface }}
            >
              {[
                { value: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
                { value: 'ingredients', label: 'Ingredients', icon: <Leaf className="w-4 h-4" /> },
                { value: 'nutrition', label: 'Nutrition', icon: <Package className="w-4 h-4" /> },
                { value: 'storage', label: 'Storage', icon: <ShieldCheck className="w-4 h-4" /> },
                { value: 'legal', label: 'Legal', icon: <Globe className="w-4 h-4" /> },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="pointer-events-auto min-h-[44px] px-4 sm:px-5 py-2.5 text-sm font-heading font-medium transition-all border-b-2 -mb-px rounded-none data-[state=active]:border-b-2 data-[state=active]:shadow-none shrink-0"
                  style={{
                    borderColor: 'transparent',
                    color: BRAND.muted,
                  }}
                  // Use CSS for active state coloring via data attribute
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon}
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ─── Overview Tab ──────────────────────────────── */}
            <TabsContent value="overview" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 gap-8"
                >
                  {/* Full description + highlights */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      About This Product
                    </h3>
                    {displayProduct?.description ? (
                      <p className="leading-relaxed text-sm sm:text-base" style={{ color: BRAND.muted }}>
                        {displayProduct.description}
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: BRAND.muted }}>
                        {displayProduct?.short_description || 'No description available.'}
                      </p>
                    )}

                    {highlights.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="font-heading font-semibold text-sm" style={{ color: BRAND.dark }}>
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
                            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.green }} />
                            <span className="text-sm" style={{ color: BRAND.dark }}>{h}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details Grid */}
                  <div className="space-y-3">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      Product Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Weight', value: displayProduct?.weight, icon: <Package className="w-3.5 h-3.5" /> },
                        { label: 'Serving Size', value: displayProduct?.serving_size, icon: <Leaf className="w-3.5 h-3.5" /> },
                        { label: 'Flavor', value: displayProduct?.flavor, icon: <Sparkles className="w-3.5 h-3.5" /> },
                        { label: 'Brand', value: displayProduct?.brand, icon: <Star className="w-3.5 h-3.5" /> },
                        { label: 'SKU', value: displayProduct?.sku, icon: <Info className="w-3.5 h-3.5" /> },
                        { label: 'Type', value: displayProduct?.type, icon: <Package className="w-3.5 h-3.5" /> },
                      ]
                        .filter(d => d.value)
                        .map((d, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="p-3 rounded-lg bg-white border"
                            style={{ borderColor: BRAND.surface }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {d.icon}
                              <p className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.muted }}>{d.label}</p>
                            </div>
                            <p className="text-sm font-medium" style={{ color: BRAND.dark }}>{d.value}</p>
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
                  className="grid md:grid-cols-2 gap-8"
                >
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      Ingredients
                    </h3>
                    {ingredientsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ingredientsList.map((ing, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="pointer-events-auto px-3 py-2 rounded-full text-xs font-medium min-h-[32px]"
                            style={{ backgroundColor: '#edf5ee', color: BRAND.green }}
                          >
                            {ing}
                          </motion.span>
                        ))}
                      </div>
                    ) : displayProduct?.ingredients ? (
                      <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                          {displayProduct.ingredients}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: BRAND.muted }}>No ingredients info available</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      Allergen Information
                    </h3>
                    {displayProduct?.allergen_info ? (
                      <div className="p-4 rounded-xl border"
                        style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                          <div>
                            <p className="text-sm font-semibold mb-1" style={{ color: '#991b1b' }}>Allergen Warning</p>
                            <p className="text-sm" style={{ color: '#b91c1c' }}>{displayProduct.allergen_info}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" style={{ color: BRAND.green }} />
                          <p className="text-sm" style={{ color: BRAND.muted }}>
                            No known allergens — always check the label for the most current information.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* ─── Nutrition Tab ─────────────────────────────── */}
            <TabsContent value="nutrition" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="nutrition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-heading font-bold text-lg mb-4" style={{ color: BRAND.dark }}>
                    Nutrition Information
                  </h3>
                  {displayProduct?.nutrition_info ? (
                    <div className="p-6 rounded-xl bg-white border max-w-2xl" style={{ borderColor: BRAND.surface }}>
                      <p className="text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                        {displayProduct.nutrition_info}
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-white border max-w-2xl" style={{ borderColor: BRAND.surface }}>
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5" style={{ color: BRAND.muted }} />
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          Nutrition information will be available soon. Check the product label for details.
                        </p>
                      </div>
                    </div>
                  )}

                  {displayProduct?.serving_size && (
                    <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: BRAND.muted }}>
                      <Leaf className="w-3.5 h-3.5" />
                      <span>Serving size: {displayProduct.serving_size}</span>
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
                  className="grid md:grid-cols-2 gap-8"
                >
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      Storage Instructions
                    </h3>
                    {displayProduct?.storage_info ? (
                      <div className="p-4 rounded-xl bg-white border flex items-start gap-3"
                        style={{ borderColor: BRAND.surface }}
                      >
                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.green }} />
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                          {displayProduct.storage_info}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          Store in a cool, dry place away from direct sunlight.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: BRAND.dark }}>
                      Shelf Life
                    </h3>
                    {displayProduct?.shelf_life ? (
                      <div className="p-4 rounded-xl bg-white border flex items-start gap-3"
                        style={{ borderColor: BRAND.surface }}
                      >
                        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.green }} />
                        <p className="text-sm leading-relaxed" style={{ color: BRAND.dark }}>
                          {displayProduct.shelf_life}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border" style={{ borderColor: BRAND.surface }}>
                        <p className="text-sm" style={{ color: BRAND.muted }}>
                          Shelf life information will be available on the product label.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* ─── Legal Tab ──────────────────────────────────── */}
            <TabsContent value="legal" className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="legal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-heading font-bold text-lg mb-4" style={{ color: BRAND.dark }}>
                    Legal & Compliance
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                    {[
                      { label: 'FSSAI License', value: displayProduct?.fssai_license, icon: <ShieldCheck className="w-4 h-4" /> },
                      { label: 'HSN Code', value: displayProduct?.hsn_code, icon: <Package className="w-4 h-4" /> },
                      { label: 'GST Rate', value: displayProduct?.gst_rate ? `${displayProduct.gst_rate}%` : null, icon: <CreditCard className="w-4 h-4" /> },
                      { label: 'Country of Origin', value: displayProduct?.country_origin, icon: <Globe className="w-4 h-4" /> },
                    ]
                      .map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 rounded-xl bg-white border"
                          style={{ borderColor: BRAND.surface }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {d.icon}
                            <p className="text-xs uppercase tracking-wider" style={{ color: BRAND.muted }}>{d.label}</p>
                          </div>
                          <p className="text-sm font-medium" style={{ color: d.value ? BRAND.dark : BRAND.muted }}>
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

        {/* ─── Contact Section ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 lg:mt-12"
        >
          <Card className="border rounded-2xl" style={{ borderColor: BRAND.surface }}>
            <CardHeader>
              <CardTitle className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: BRAND.dark }}>
                <MessageCircle className="w-5 h-5" style={{ color: BRAND.green }} />
                Need Help? Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-all min-h-[44px]"
                  style={{ backgroundColor: '#25D36608', borderColor: '#25D36620', border: '1px solid #25D36620' }}
                  onClick={() => window.open('https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}
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
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-all min-h-[44px]"
                  style={{ backgroundColor: `${BRAND.blue}08`, borderColor: `${BRAND.blue}20`, border: `1px solid ${BRAND.blue}20` }}
                  onClick={() => window.open('mailto:hello@notjust.health?subject=Query%20about%20NOTJUST%20Watr', '_blank')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[40px]"
                    style={{ backgroundColor: `${BRAND.blue}15` }}
                  >
                    <Mail className="w-5 h-5" style={{ color: BRAND.blue }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>Email</p>
                    <p className="text-[11px]" style={{ color: BRAND.muted }}>hello@notjust.health</p>
                  </div>
                </button>

                <button
                  className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl transition-all min-h-[44px]"
                  style={{ backgroundColor: `${BRAND.green}08`, borderColor: `${BRAND.green}20`, border: `1px solid ${BRAND.green}20` }}
                  onClick={() => window.open('sms:+919876543210?body=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center min-h-[40px]"
                    style={{ backgroundColor: `${BRAND.green}15` }}
                  >
                    <Smartphone className="w-5 h-5" style={{ color: BRAND.green }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: BRAND.dark }}>SMS</p>
                    <p className="text-[11px]" style={{ color: BRAND.muted }}>+91 98765 43210</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
