'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import ProductImage from '@/components/ProductImage'
import {
  ArrowRight, ChevronLeft, ChevronRight, CheckCircle, Leaf,
  Package, Shield, Star, Sparkles, Zap, TrendingUp,
  Lock, Unlock, ShoppingBag, BookOpen, ShoppingCart
} from 'lucide-react'
import SiteFooter from '@/components/SiteFooter'
import { useAppStore } from '@/store/app-store'
import { productService, productLearningService } from '@/lib/data-service'
import type { Product, ProductLearningProgress } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { toast } from 'sonner'

// ─── BRAND CONSTANTS ────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
}

// ─── ANIMATION VARIANTS ─────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
}

// ─── ANIMATED SECTION WRAPPER ────────────────────────────────
function AnimatedSection({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ═══════════════════════════════════════════════════════════
// ProductPage — Dedicated products page with horizontal carousel
// ═══════════════════════════════════════════════════════════
export default function ProductPage() {
  const { navigateTo, user, setSelectedProductId, products, setProducts, setRedirectAfterLogin } = useAppStore()
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [completedProductIds, setCompletedProductIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(12)

  // ── Fetch products on mount ──
  useEffect(() => {
    productService.list({ active: true })
      .then((data) => {
        setLocalProducts(data)
        setProducts(data)
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err)
        toast.error('Failed to load products')
      })
      .finally(() => setLoading(false))
  }, [setProducts])

  // ── Fetch per-product learning progress for the current user ──
  useEffect(() => {
    if (!user) return
    productLearningService.get(user.id)
      .then((progressList: ProductLearningProgress[]) => {
        const completed = new Set<string>()
        for (const p of progressList) {
          if (p.status === 'COMPLETED') completed.add(p.product_id)
        }
        setCompletedProductIds(completed)
      })
      .catch(() => {
        // Silently fail — progress fetch is non-critical
      })
  }, [user])

  // ── Product navigation handler ──
  const handleLearnMore = (product: Product) => {
    // Always go to product detail page first — login prompt happens on the product page
    setSelectedProductId(product.id)
    navigateTo('product-detail')
  }

  // ── Use store products or local ──
  const displayProducts = products.length > 0 ? products : localProducts

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f0]">

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — Product page
          ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1">

        {/* ── Hero Banner ── */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-[#1f1e1c] via-[#262520] to-[#1f1e1c] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <Badge className="mb-4 bg-[#48805b]/20 text-[#afb75d] border-[#afb75d]/30 text-xs font-semibold tracking-wider uppercase">
                Our Wellness Shots
              </Badge>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extralight text-white mb-6 leading-tight tracking-tight">
                NOTJUST WATER™{' '}
                <span className="italic font-light text-[#afb75d]">Pre-Meal Wellness Shot</span>
              </h1>
              <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
                Choose from NOTJUST Watr Fizz or NOTJUST Watr Still — scroll to explore our products.
              </p>
            </motion.div>

            {/* ── Pack type info cards ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto mt-10"
            >
              <div className="rounded-xl border border-[#e7b973]/40 bg-[#fff7ea]/10 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#e7b973]/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-[#e7b973]" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-white">Monthly Pack (60 Shots)</p>
                  <p className="text-xs text-white/40 mt-1">Daily use, 2 shots/day</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#48805b]/25 bg-[#48805b]/10 p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#48805b]/15 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-[#48805b]" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-white">Eco-Friendly Refill Pack</p>
                  <p className="text-xs text-white/40 mt-1">Sustainable and affordable</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Product Carousel ── */}
        <AnimatedSection className="py-16 md:py-24 bg-[#f4f3f0] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1f1e1c] mb-3">
                Explore Our Products
              </h2>
              <p className="text-[#88837b] text-sm sm:text-base max-w-xl mx-auto">
                Each variant is crafted with 100% natural ingredients to support your wellness journey.
              </p>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-[#88837b]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-[#48805b] border-t-transparent rounded-full"
                  />
                  <span className="text-sm font-medium">Loading products...</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Product Grid (no scroll, 3 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.slice(0, visibleCount).map((product, idx) => {
                    const discount = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0
                    const highlightItems = product.highlights ? product.highlights.split(',').map(h => h.trim()) : []
                    const visibleHighlights = highlightItems.slice(0, 3)

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="w-full"
                      >
                        <Card className="border-[#3c3a35] bg-[#262520] text-white overflow-hidden rounded-2xl shadow-2xl shadow-black/15 hover:shadow-3xl hover:shadow-black/20 transition-shadow duration-500 premium-card h-full flex flex-col">
                          {/* Product Image - Fixed 1:1 aspect ratio */}
                          <div className="relative w-full aspect-square overflow-hidden bg-[#1f1e1c]">
                            <ProductImage
                              src={product.image_url}
                              alt={product.name}
                              productType={product.type}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain p-8"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1e1c]/80 via-transparent to-transparent" />

                            {/* Featured badge */}
                            {product.featured && (
                              <div className="absolute top-4 right-4">
                                <span className="rounded-full bg-[#e7b973] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-white" /> Featured
                                </span>
                              </div>
                            )}

                            {/* Locked badge — show when user is not logged in */}
                            {!user && (
                              <div className="absolute top-4 left-4">
                                <span className="rounded-full bg-[#1f1e1c]/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 flex items-center gap-1.5 border border-white/10">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              </div>
                            )}

                            {/* Discount label */}
                            {product.discount_label && (
                              <div className="absolute top-4 left-4">
                                <span className="rounded-full bg-[#afb75d] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#afb75d]/20">
                                  {product.discount_label}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Content */}
                          <CardContent className="p-5 lg:p-6 flex flex-col gap-3 flex-1">
                            {/* Type row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#48805b]">{product.category || product.type}</p>
                              {product.category && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2e91b2]/20 text-[#2e91b2]">{product.category}</span>
                              )}
                            </div>

                            <CardTitle className="font-heading text-2xl text-white leading-tight">{product.name}</CardTitle>

                            {product.short_description && (
                              <CardDescription className="text-[#afb75d] text-sm font-medium">{product.short_description}</CardDescription>
                            )}

                            <p className="text-sm text-white/45 leading-relaxed line-clamp-3 flex-1">{product.description}</p>

                            {/* Highlights */}
                            {visibleHighlights.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {visibleHighlights.map((h, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#48805b]/25 bg-[#48805b]/10 text-[#5ca878]">
                                    <CheckCircle className="w-2.5 h-2.5 text-[#48805b]" />{h}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Price + CTA */}
                            <div className="flex items-center justify-between gap-4 mt-auto pt-3 border-t border-white/[0.06]">
                              <div>
                                <div className="flex items-baseline gap-2">
                                  <p className="font-heading text-2xl font-bold text-white">₹{product.price.toLocaleString()}</p>
                                  {product.mrp && product.mrp > product.price && (
                                    <p className="text-sm line-through text-white/30">₹{product.mrp.toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleLearnMore(product)}
                                className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-full text-sm px-5 min-h-[44px] shadow-lg shadow-[#48805b]/20 transition-all duration-300 flex items-center gap-1.5"
                              >
                                {/* Always "Learn More" — the product page handles learning, review and purchase */}
                                <BookOpen className="w-4 h-4" />
                                Learn More
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {/* ── Load More Button ── */}
                {displayProducts.length > visibleCount && (
                  <div className="flex justify-center mt-12">
                    <Button
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="bg-[#1f1e1c] hover:bg-[#262520] text-white border border-white/10 hover:border-white/20 font-heading font-semibold rounded-full px-8 py-3 shadow-xl transition-all duration-300"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* ── Key Benefits ── */}
        <AnimatedSection className="py-16 md:py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <Badge className="mb-4 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">Why Choose Us</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
                Key{' '}
                <span className="italic font-light text-[#48805b]">Benefits</span>
              </h2>
              <p className="text-[#88837b] text-base sm:text-lg max-w-2xl mx-auto">
                What makes NOTJUST WATER™ different from anything else on the market.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: 'Zero Sugar', desc: 'No added sugar — pure wellness without the guilt.', color: '#48805b' },
                { icon: Zap, title: 'Zero Calories', desc: 'Zero-calorie formulation that works before every meal.', color: '#afb75d' },
                { icon: TrendingUp, title: 'Glycemic Control', desc: 'Clinically designed to reduce post-meal sugar spikes.', color: '#2e91b2' },
                { icon: Leaf, title: 'Natural Ingredients', desc: 'Made with 100% natural, plant-based ingredients.', color: '#48805b' },
              ].map((benefit, idx) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group"
                >
                  <Card className="border-[#e3dfd8] bg-[#f4f3f0] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#48805b]/8 transition-all duration-500 h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${benefit.color}15`, boxShadow: `0 0 12px 4px ${benefit.color}15` }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <benefit.icon className="w-7 h-7" style={{ color: benefit.color }} />
                      </motion.div>
                      <CardTitle className="font-heading text-lg font-bold text-[#1f1e1c] group-hover:text-[#48805b] transition-colors duration-300">
                        {benefit.title}
                      </CardTitle>
                      <CardDescription className="text-[#88837b] text-sm leading-relaxed">
                        {benefit.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </main>

      <SiteFooter />
    </div>
  )
}
