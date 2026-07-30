'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, ChevronLeft, ChevronRight, CheckCircle, Leaf,
  Package, Shield, Star, Sparkles, Zap, TrendingUp,
  Lock, Unlock, ShoppingBag,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { productService } from '@/lib/data-service'
import type { Product } from '@/lib/data-service'
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
  const [activeProductIndex, setActiveProductIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

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

  // ── Carousel scroll tracking ──
  const updateActiveIndex = useCallback(() => {
    if (!carouselRef.current) return
    const container = carouselRef.current
    const scrollLeft = container.scrollLeft
    const childWidth = container.firstElementChild?.clientWidth || 400
    const gap = 16
    const newIndex = Math.round(scrollLeft / (childWidth + gap))
    setActiveProductIndex(Math.max(0, newIndex))
  }, [])

  useEffect(() => {
    const container = carouselRef.current
    if (!container) return
    container.addEventListener('scroll', updateActiveIndex, { passive: true })
    return () => container.removeEventListener('scroll', updateActiveIndex)
  }, [updateActiveIndex, loading])

  // ── Product navigation handler ──
  const handleLearnMore = (product: Product) => {
    if (!user) {
      setRedirectAfterLogin('product-detail')
      setSelectedProductId(product.id)
      navigateTo('auth-login')
      return
    }
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
                {/* Scroll arrows — Desktop */}
                <button
                  onClick={() => {
                    if (!carouselRef.current) return
                    const container = carouselRef.current
                    const childWidth = container.firstElementChild?.clientWidth || 400
                    container.scrollTo({ left: container.scrollLeft - (childWidth + 16), behavior: 'smooth' })
                  }}
                  className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg shadow-black/10 border border-[#e3dfd8] items-center justify-center text-[#48805b] hover:bg-[#48805b] hover:text-white transition-all duration-300"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (!carouselRef.current) return
                    const container = carouselRef.current
                    const childWidth = container.firstElementChild?.clientWidth || 400
                    container.scrollTo({ left: container.scrollLeft + (childWidth + 16), behavior: 'smooth' })
                  }}
                  className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg shadow-black/10 border border-[#e3dfd8] items-center justify-center text-[#48805b] hover:bg-[#48805b] hover:text-white transition-all duration-300"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Container */}
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto scroll-snap-type-x mandatory pb-4 scrollbar-thin"
                  style={{
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                  }}
                >
                  {displayProducts.map((product, idx) => {
                    const isStill = product.type === 'STILL'
                    const discount = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0
                    const highlightItems = product.highlights ? product.highlights.split(',').map(h => h.trim()) : []
                    const visibleHighlights = highlightItems.slice(0, 3)

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.15 }}
                        className="flex-shrink-0 w-[85vw] md:w-[400px] scroll-snap-align-start"
                        style={{ scrollSnapAlign: 'start' }}
                      >
                        <Card className="border-[#3c3a35] bg-[#262520] text-white overflow-hidden rounded-2xl shadow-2xl shadow-black/15 hover:shadow-3xl hover:shadow-black/20 transition-shadow duration-500 premium-card h-full">
                          {/* Product Image */}
                          <div className="relative min-h-[280px] lg:min-h-[320px] overflow-hidden bg-[#1f1e1c]">
                            <Image
                              src={product.image_url || (isStill ? '/images/product-still.webp' : '/images/product-fizz.webp')}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 85vw, 400px"
                              className="object-contain p-8"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1e1c]/80 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#262520]/25" />

                            {/* Bottom-left badges */}
                            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
                                {isStill ? 'Still Variant' : 'Fizz Variant'}
                              </span>
                              {discount > 0 && (
                                <span className="rounded-full bg-[#48805b] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white">
                                  {discount}% OFF
                                </span>
                              )}
                            </div>

                            {/* Featured badge */}
                            {product.featured && (
                              <div className="absolute top-4 right-4">
                                <span className="rounded-full bg-[#e7b973] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-white" /> Featured
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

                            {/* Locked badge — show when user is not logged in */}
                            {!user && (
                              <div className="absolute top-4 left-4">
                                <span className="rounded-full bg-[#1f1e1c]/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 flex items-center gap-1.5 border border-white/10">
                                  <Lock className="w-3 h-3" /> Locked
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product Content */}
                          <CardContent className="p-5 lg:p-6 flex flex-col gap-3">
                            {/* Brand + Type row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {product.brand && (
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 border border-white/15 rounded-full px-2.5 py-0.5 bg-white/[0.03]">
                                  {product.brand}
                                </span>
                              )}
                              <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#48805b]">{product.type} Variant</p>
                              {product.category && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2e91b2]/20 text-[#2e91b2]">{product.category}</span>
                              )}
                              {product.flavor && (
                                <span className="text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-[#afb75d]/15 text-[#afb75d] border border-[#afb75d]/25">{product.flavor}</span>
                              )}
                            </div>

                            <CardTitle className="font-heading text-2xl text-white leading-tight">{product.name}</CardTitle>

                            {product.short_description && (
                              <CardDescription className="text-[#afb75d] text-sm font-medium">{product.short_description}</CardDescription>
                            )}

                            <p className="text-sm text-white/45 leading-relaxed line-clamp-3">{product.description}</p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { value: product.weight ? product.weight.split(',')[0]?.trim() : '14 shots', label: 'Per pack' },
                                { value: '50 ml', label: 'Per shot' },
                                { value: '0 cal', label: 'Zero calorie' },
                              ].map(stat => (
                                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                                  <p className="text-base font-bold text-white leading-none">{stat.value}</p>
                                  <p className="text-[9px] uppercase tracking-wide text-white/30 mt-1.5">{stat.label}</p>
                                </div>
                              ))}
                            </div>

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
                            <div className="flex items-center justify-between gap-4 mt-2 pt-3 border-t border-white/[0.06]">
                              <div>
                                <div className="flex items-baseline gap-2">
                                  <p className="font-heading text-2xl font-bold text-white">₹{product.price.toLocaleString()}</p>
                                  {product.mrp && product.mrp > product.price && (
                                    <p className="text-sm line-through text-white/30">₹{product.mrp.toLocaleString()}</p>
                                  )}
                                </div>
                                <p className="text-[10px] text-white/35 mt-0.5">incl. tax {discount > 0 && `· Save ₹${(product.mrp! - product.price).toLocaleString()}`}</p>
                              </div>
                              <Button
                                onClick={() => handleLearnMore(product)}
                                className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-full text-sm px-5 min-h-[44px] shadow-lg shadow-[#48805b]/20 transition-all duration-300 flex items-center gap-1.5"
                              >
                                {!user || !user.learning_completed ? (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Unlock <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-4 h-4" />
                                    Shop Now <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* FSSAI badge */}
                            {product.fssai_license && (
                              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2">
                                <Shield className="w-3 h-3 text-white/30" />
                                <span className="text-[10px] text-white/30 tracking-wide">FSSAI Lic. {product.fssai_license}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {/* ── Scroll Progress Dots ── */}
                {displayProducts.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    {displayProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!carouselRef.current) return
                          const container = carouselRef.current
                          const childWidth = container.firstElementChild?.clientWidth || 400
                          container.scrollTo({ left: idx * (childWidth + 16), behavior: 'smooth' })
                          setActiveProductIndex(idx)
                        }}
                        className={`rounded-full transition-all duration-300 min-h-[44px] flex items-center justify-center ${
                          idx === activeProductIndex
                            ? 'w-8 h-3 bg-[#48805b]'
                            : 'w-3 h-3 bg-[#e3dfd8] hover:bg-[#88837b]/50'
                        }`}
                        aria-label={`View product ${idx + 1}`}
                      >
                        <span className="sr-only">Product {idx + 1}</span>
                      </button>
                    ))}
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

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#1f1e1c] py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-8 justify-between">
            <div>
              <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={32} className="h-8 w-auto object-contain mb-3" />
              <p className="text-white/40 text-sm">Pre-Meal Wellness Shot</p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-white text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigateTo('landing')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center text-white/50">Home</button></li>
                <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center text-white/50">Products</button></li>
                <li><button onClick={() => navigateTo('our-journey')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center text-white/50">Our Journey</button></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-white/[0.06]" />
          <p className="text-white/30 text-xs text-center">© 2025 NOTJUST HEALTH™. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
