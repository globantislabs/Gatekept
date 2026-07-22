'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ArrowRight, Heart, Zap, Leaf, ChevronRight, Menu, X, Star,
  CheckCircle, Clock, Users, Globe, TrendingUp, Award, Shield,
  Package, Utensils, MessageCircle, Mail, Smartphone, MapPin,
  Instagram, Twitter, Linkedin, Youtube, GraduationCap, Lock,
  ChevronDown, ChevronLeft, Sparkles, Home, Store, CreditCard,
  BarChart3, Send, ShieldCheck
} from 'lucide-react'
import { useAppStore, type AppView } from '@/store/app-store'
import { productService } from '@/lib/data-service'
import type { Product } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
}

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } }
}

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
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

// ─── ANIMATED COUNTER ────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const duration = 2

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, end, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ─── MAIN LANDING PAGE COMPONENT ────────────────────────────
export default function LandingPage() {
  const { navigateTo, user, setSelectedProductId, products, setProducts } = useAppStore()
  const [localProducts, setLocalProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeProductIndex, setActiveProductIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // ── Fetch products on mount ──
  useEffect(() => {
    setLoading(true)
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

  // ── Scroll-responsive navbar ──
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

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

  // ── Auto-scroll carousel ──
  useEffect(() => {
    if (localProducts.length === 0 || !carouselRef.current) return
    const interval = setInterval(() => {
      const container = carouselRef.current
      if (!container) return
      const nextIndex = (activeProductIndex + 1) % localProducts.length
      const childWidth = container.firstElementChild?.clientWidth || 400
      const gap = 16
      container.scrollTo({
        left: nextIndex * (childWidth + gap),
        behavior: 'smooth'
      })
      setActiveProductIndex(nextIndex)
    }, 5000)
    return () => clearInterval(interval)
  }, [localProducts.length, activeProductIndex])

  // ── Scroll helper ──
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // ── Product navigation handler ──
  const handleLearnMore = (product: Product) => {
    setSelectedProductId(product.id)
    navigateTo('product-detail')
  }

  // ── Nav links ──
  const navLinks = [
    { label: 'Products', view: 'products' as AppView, icon: Store },
    { label: 'Our Journey', view: 'our-journey' as AppView, icon: Globe },
  ]

  // ── Use store products or local ──
  const displayProducts = products.length > 0 ? products : localProducts

  return (
    <div className="min-h-screen flex flex-col">

      {/* ═══════════════════════════════════════════════════════════
          NAVBAR — Fixed top, scroll-responsive
          ═══════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <button
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Image
                src="/images/notjust-logo-clean.png"
                alt="NotJust Watr"
                width={120}
                height={40}
                className={`h-9 w-auto object-contain transition-all duration-300 group-hover:scale-105 ${
                  scrolled ? 'brightness-0' : 'brightness-0 invert'
                }`}
              />
            </button>

            {/* Center Nav Links — Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (!user && link.view !== 'landing') {
                      navigateTo('auth-login')
                      toast.info('Please login first')
                      return
                    }
                    navigateTo(link.view)
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] ${
                    scrolled
                      ? 'text-[#88837b] hover:text-[#48805b] hover:bg-[#48805b]/5'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right side — User / Login */}
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => navigateTo('profile')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 min-h-[44px] ${
                    scrolled
                      ? 'text-[#1f1e1c] hover:bg-[#48805b]/5'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#48805b] flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user.name}</span>
                </button>
              ) : (
                <Button
                  onClick={() => navigateTo('auth-login')}
                  className={`rounded-full font-heading font-semibold text-sm min-h-[44px] transition-all duration-300 ${
                    scrolled
                      ? 'bg-[#48805b] hover:bg-[#3a6a4a] text-white'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm'
                  }`}
                >
                  Login
                </Button>
              )}

              {/* Mobile Hamburger */}
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <button
                    className={`md:hidden flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300 ${
                      scrolled ? 'text-[#1f1e1c]' : 'text-white'
                    }`}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#1f1e1c] border-l border-white/[0.06]">
                  <SheetHeader>
                    <SheetTitle className="text-white font-heading flex items-center gap-2">
                      <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={32} className="h-8 w-auto object-contain brightness-0 invert" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-6 px-2">
                    {/* Nav links */}
                    {[
                      { label: 'Products', icon: Store, action: () => { navigateTo('products'); setMobileNavOpen(false) } },
                      { label: 'Our Journey', icon: Globe, action: () => { navigateTo('our-journey'); setMobileNavOpen(false) } },
                      { label: 'Learning', icon: GraduationCap, action: () => { navigateTo('product-learning'); setMobileNavOpen(false) } },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium min-h-[44px]"
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    ))}

                    <Separator className="my-3 bg-white/[0.06]" />

                    {user ? (
                      <button
                        onClick={() => { navigateTo('profile'); setMobileNavOpen(false) }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-300 text-sm font-medium min-h-[44px]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#48805b] flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        {user.name}
                      </button>
                    ) : (
                      <Button
                        onClick={() => { navigateTo('auth-login'); setMobileNavOpen(false) }}
                        className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl min-h-[44px]"
                      >
                        Sign In <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          A. HERO SECTION — Full-width with gradient overlay & floating blobs
          ═══════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-[#1f1e1c]">
        {/* Animated gradient blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute mix-blend-screen opacity-25 animate-hero-drift-1"
            style={{
              width: '880px', height: '520px', left: '-5%', top: '0%',
              backgroundImage: 'radial-gradient(ellipse closest-side, oklch(55% 0.09 155) 0%, transparent 75%)',
              filter: 'blur(60px)'
            }}
          />
          <div
            className="absolute mix-blend-multiply opacity-20 animate-hero-drift-2"
            style={{
              width: '720px', height: '480px', right: '-8%', top: '10%',
              backgroundImage: 'radial-gradient(ellipse closest-side, oklch(75% 0.1 95) 0%, transparent 75%)',
              filter: 'blur(70px)'
            }}
          />
          <div
            className="absolute mix-blend-screen opacity-15 animate-hero-drift-3"
            style={{
              width: '600px', height: '400px', left: '30%', bottom: '5%',
              backgroundImage: 'radial-gradient(ellipse closest-side, oklch(65% 0.08 170) 0%, transparent 75%)',
              filter: 'blur(80px)'
            }}
          />
          <div
            className="absolute mix-blend-multiply opacity-18 animate-hero-drift-4"
            style={{
              width: '500px', height: '350px', right: '20%', top: '50%',
              backgroundImage: 'radial-gradient(ellipse closest-side, oklch(78% 0.06 145) 0%, transparent 75%)',
              filter: 'blur(90px)'
            }}
          />
          <div
            className="absolute mix-blend-screen opacity-12 animate-hero-drift-5"
            style={{
              width: '700px', height: '450px', left: '10%', top: '60%',
              backgroundImage: 'radial-gradient(ellipse closest-side, oklch(70% 0.07 160) 0%, transparent 75%)',
              filter: 'blur(75px)'
            }}
          />
        </div>

        {/* Floating Particles */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#48805b]/15"
              style={{
                width: Math.random() * 6 + 2 + 'px',
                height: Math.random() * 6 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT — Headline & CTA */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp}>
                <Badge className="mb-6 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  <Zap className="w-3 h-3 mr-1.5" /> NOTJUST WATER™
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extralight text-white leading-[1.05] tracking-tight mb-6"
              >
                Pre-Meal{' '}
                <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d] inline-block animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #afb75d 0%, #d4da8a 25%, #afb75d 50%, #d4da8a 75%, #afb75d 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Wellness Shot</span>
                <br />
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.25rem]">Reduce Sugar Spikes Naturally</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-white/60 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                NOTJUST WATER™ is a convenient 50 ml pre-meal shot designed to help reduce the
                Glycemic Index (GI) impact of carbohydrate-rich foods. Simply take one shot before your
                meal to support a healthier glycemic response.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={() => scrollToSection('product-carousel')}
                  className="bg-[#e3dfd8] hover:bg-white text-[#1f1e1c] font-heading font-semibold text-sm px-7 py-5 rounded-full shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300 min-h-[44px]"
                >
                  Explore Our Products <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('how-it-works')}
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 font-heading font-semibold text-sm px-7 py-5 rounded-full backdrop-blur-sm transition-all duration-300 min-h-[44px]"
                >
                  Learn More <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-5 text-white/50 text-xs font-medium">
                <div className="flex items-center gap-1.5 min-h-[44px]"><CheckCircle className="w-3.5 h-3.5 text-[#afb75d]" /> Supports Blood Sugar Management</div>
                <div className="flex items-center gap-1.5 min-h-[44px]"><Leaf className="w-3.5 h-3.5 text-[#afb75d]" /> 50 ml Ready-to-Drink Shot</div>
                <div className="flex items-center gap-1.5 min-h-[44px]"><Clock className="w-3.5 h-3.5 text-[#afb75d]" /> 10-15 Minutes Before Meals</div>
              </motion.div>
            </motion.div>

            {/* RIGHT - Hero product preview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="relative h-[620px] max-w-xl ml-auto">
                {displayProducts.slice(0, 2).map((product, idx) => {
                  const isSecond = idx === 1
                  return (
                    <div
                      key={product.id}
                      className={`card-reveal absolute w-[280px] bg-[#302f2c] rounded-xl overflow-hidden ring-1 ring-white/[0.12] shadow-2xl shadow-black/30 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:ring-[#afb75d]/40 ${isSecond ? 'right-0 top-[270px]' : 'left-0 top-0'}`}
                      style={{ animationDelay: `${0.1 + idx * 0.2}s` }}
                      onClick={() => handleLearnMore(product)}
                    >
                      <div className="relative h-[250px] bg-gradient-to-b from-[#1a1917] to-[#2a2926] overflow-hidden">
                        <Image
                          src={product.image_url || (product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')}
                          alt={product.name}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500 p-4"
                        />
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/35 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          {product.type === 'STILL' ? 'Still' : 'Carbonated'}
                        </div>
                      </div>
                      <div className="px-4 py-3 border-t border-white/[0.08]">
                        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-[#afb75d] mb-2">{product.type} Variant</p>
                        <div className="flex items-end justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-base font-medium text-white truncate">{product.name}</h3>
                            <p className="text-[11px] text-white/45 mt-1">NotJust</p>
                          </div>
                          <span className="text-[#afb75d] text-sm font-semibold flex-shrink-0">₹{product.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={() => scrollToSection('brand-story')}
        >
          <ChevronDown className="w-6 h-6 text-white/40" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          B. BRAND STORY SECTION — dark bg, two-column
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="brand-story" className="py-20 md:py-28 bg-[#1f1e1c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div variants={slideInLeft} className="relative">
              <div className="relative aspect-[4/5] flex gap-6 items-center justify-center">
                {/* Fizz bottle */}
                <div className="relative flex-1 h-full">
                  <Image src="/images/product-fizz.webp" alt="NotJust Watr Fizz" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain animate-hero-product-float" />
                </div>
                {/* Still bottle */}
                <div className="relative flex-1 h-full">
                  <Image src="/images/product-still.webp" alt="NotJust Watr Still" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain animate-hero-product-float" style={{ animationDelay: '1s' }} />
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 bg-gradient-to-br from-[#48805b] to-[#3a6a4a] rounded-2xl px-6 py-5 text-white shadow-2xl shadow-black/30">
                <p className="font-heading text-3xl font-bold">40%</p>
                <p className="text-xs text-white/70 font-medium">Spike Reduction</p>
              </div>
            </motion.div>
            <motion.div variants={slideInRight}>
              <Badge className="mb-4 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">NOTJUST WATER™</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-white mb-6 leading-[1.1] tracking-tight">
                Enjoy Your Favorite Foods<br />
                <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d]">Smarter.</span>
              </h2>
              <p className="text-white/50 text-base sm:text-lg mb-8 leading-relaxed">
                A simple pre-meal wellness solution designed to support better glycemic management as
                part of a balanced lifestyle. Take one 50 ml shot before your meal to make carbohydrate-rich
                foods easier to manage.
              </p>
              <div className="grid gap-3">
                {[
                  { icon: CheckCircle, title: 'Helps Reduce GI Impact', desc: 'Designed for carbohydrate-rich meals' },
                  { icon: Heart, title: 'Blood Sugar Support', desc: 'Supports healthier post-meal response' },
                  { icon: Package, title: '14 × 50 ml Shots', desc: 'Ready-to-drink pack for daily use' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/15 transition-colors duration-300">
                    <div className="w-10 h-10 rounded-lg bg-[#48805b]/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#afb75d]" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-xs text-white/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          C. HOW IT WORKS SECTION — light bg, 4 steps
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="how-it-works" className="py-20 md:py-28 bg-[#f4f3f0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs font-semibold tracking-wider uppercase">How It Works</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              Simple Pre-Meal{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Wellness</span>
            </h2>
            <p className="text-[#88837b] text-base sm:text-lg max-w-2xl mx-auto">
              Easy to incorporate into your daily routine before carbohydrate-rich meals.
            </p>
          </motion.div>

          {/* Steps Row with Animated Dashed Connector */}
          <div className="relative">
            {/* Animated dashed line (desktop) */}
            <div className="hidden lg:block absolute top-[48px] left-[14%] right-[14%]">
              <div className="h-0 border-t-2 border-dashed border-[#c5c0b8]" />
              <motion.div
                className="absolute top-0 left-0 h-0 border-t-2 border-[#48805b]"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -top-[5px] w-[12px] h-[12px] rounded-full bg-[#48805b] shadow-lg shadow-[#48805b]/50"
                initial={{ left: '0%' }}
                whileInView={{ left: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
              />
            </div>

            {/* Step Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {[
                { num: '01', icon: Package, title: 'Open', desc: 'Keep your 14 × 50 ml shot pack ready before meals.', color: '#48805b', badge: 'Pack of 14', badgeIcon: Package },
                { num: '02', icon: Clock, title: 'Take', desc: 'Drink one 50 ml shot 10-15 minutes before your meal.', color: '#48805b', badge: 'Pre-Meal', badgeIcon: Clock },
                { num: '03', icon: Utensils, title: 'Eat', desc: 'Enjoy your carbohydrate-rich foods as part of a balanced lifestyle.', color: '#48805b', badge: 'Daily Routine', badgeIcon: Utensils },
                { num: '04', icon: TrendingUp, title: 'Support', desc: 'Help manage post-meal blood sugar spikes and glycemic response.', color: '#48805b', badge: 'Smarter Meals', badgeIcon: TrendingUp },
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.25, ease: 'easeOut' }}
                  className="relative flex flex-col items-center text-center group"
                >
                  <motion.div
                    className="relative z-10 mb-5"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 + idx * 0.25 }}
                  >
                    <div
                      className="w-[88px] h-[88px] rounded-2xl text-white flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:rounded-3xl animate-pulse-glow"
                      style={{ backgroundColor: step.color, boxShadow: `0 8px 24px ${step.color}30` }}
                    >
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
                      >
                        <step.icon className="w-8 h-8" />
                      </motion.div>
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.num}
                    </div>
                  </motion.div>

                  <motion.h3
                    className="font-heading text-lg font-bold text-[#1f1e1c] mb-1.5 transition-colors duration-300 group-hover:text-[#48805b]"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.25 }}
                  >
                    {step.title}
                  </motion.h3>

                  <motion.p
                    className="text-[#88837b] text-sm leading-relaxed max-w-[240px] min-h-[48px] mx-auto mb-3 transition-colors duration-300 group-hover:text-[#1f1e1c]/70"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.25 }}
                  >
                    {step.desc}
                  </motion.p>

                  <motion.div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300"
                    style={{
                      backgroundColor: `${step.color}10`,
                      color: step.color,
                      borderColor: `${step.color}25`,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 + idx * 0.25 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    <step.badgeIcon className="w-3 h-3" />
                    {step.badge}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          D. SCIENCE SECTION — white bg, graph + stats
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={slideInLeft}>
              <div className="bg-gradient-to-br from-[#48805b] to-[#3a6a4a] rounded-2xl p-8 md:p-10 text-white shadow-2xl shadow-[#48805b]/15">
                <h3 className="font-heading text-2xl font-bold mb-2">Glycemic Response</h3>
                <p className="text-white/60 text-sm mb-6">See how NOTJUST WATER™ supports a healthier post-meal response.</p>
                {/* SVG Graph */}
                <svg viewBox="0 0 400 200" className="w-full h-auto">
                  <defs>
                    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#afb75d" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#afb75d" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <line x1="40" y1="20" x2="40" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="40" y1="170" x2="380" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                  <line x1="40" y1="95" x2="380" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4"/>
                  <text x="10" y="175" fill="rgba(255,255,255,0.5)" fontSize="9">0h</text>
                  <text x="10" y="100" fill="rgba(255,255,255,0.5)" fontSize="9">2h</text>
                  <text x="10" y="25" fill="rgba(255,255,255,0.5)" fontSize="9">4h</text>
                  <path d="M40,170 Q100,160 130,40 Q160,60 200,120 Q260,155 380,165" fill="url(#redGrad)" />
                  <path d="M40,170 Q100,160 130,40 Q160,60 200,120 Q260,155 380,165" fill="none" stroke="#ff6b6b" strokeWidth="2.5" />
                  <path d="M40,170 Q100,165 130,110 Q160,115 200,140 Q260,160 380,168" fill="url(#greenGrad)" />
                  <path d="M40,170 Q100,165 130,110 Q160,115 200,140 Q260,160 380,168" fill="none" stroke="#afb75d" strokeWidth="2.5" />
                  <circle cx="130" cy="40" r="3" fill="#ff6b6b"/>
                  <text x="140" y="38" fill="#ff6b6b" fontSize="10" fontWeight="bold">Without NotJust</text>
                  <circle cx="130" cy="110" r="3" fill="#afb75d"/>
                  <text x="140" y="108" fill="#afb75d" fontSize="10" fontWeight="bold">With NotJust</text>
                </svg>
              </div>
            </motion.div>
            <motion.div variants={slideInRight}>
              <Badge className="mb-4 bg-[#2e91b2]/10 text-[#2e91b2] border-[#2e91b2]/20 text-xs font-semibold tracking-wider uppercase">The Science</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-extralight text-[#1f1e1c] mb-6 leading-tight tracking-tight">
                Key Benefits for<br />
                <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Smarter Meals</span>
              </h2>
              <p className="text-[#88837b] text-base sm:text-lg mb-8 leading-relaxed">
                NOTJUST WATER™ helps reduce the GI impact of meals, supports healthy blood sugar
                management, and comes in a convenient ready-to-drink format.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '50 ml', label: 'Per Shot' },
                  { value: '10-15', label: 'Minutes Before Meals' },
                  { value: '14', label: 'Shots Per Pack' },
                  { value: 'GI', label: 'Impact Support' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-[#f4f3f0] border border-[#e3dfd8]">
                    <p className="font-heading text-2xl font-bold text-[#48805b]">{stat.value}</p>
                    <p className="text-xs text-[#88837b] font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          E. PRODUCT CAROUSEL SECTION — HORIZONTAL SCROLL (CRITICAL)
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection id="product-carousel" className="py-20 md:py-28 bg-[#f4f3f0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="mb-4 bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs font-semibold tracking-wider uppercase">Our Wellness Shots</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              NOTJUST WATER™{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Pre-Meal Wellness Shot</span>
            </h2>
            <p className="text-[#88837b] text-base sm:text-lg max-w-2xl mx-auto">
              Choose from NOTJUST Watr Fizz or NOTJUST Watr Still — scroll to explore our products.
            </p>
          </motion.div>

          {/* ── Pack type info cards ── */}
          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-12">
            <div className="rounded-xl border border-[#e7b973]/40 bg-[#fff7ea] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#e7b973]/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-[#b56b20]" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-[#1f1e1c]">Monthly Pack (60 Shots)</p>
                <p className="text-xs text-[#6b6560] mt-1">Daily use, 2 shots/day</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#48805b]/25 bg-[#edf5ee] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#48805b]/15 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-[#48805b]" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-[#1f1e1c]">Eco-Friendly Refill Pack</p>
                <p className="text-xs text-[#6b6560] mt-1">Sustainable and affordable</p>
              </div>
            </div>
          </motion.div>

          {/* ── HORIZONTAL SCROLL CAROUSEL ── */}
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
                              className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-full text-sm px-5 min-h-[44px] shadow-lg shadow-[#48805b]/20 transition-all duration-300"
                            >
                              Learn More <ChevronRight className="w-4 h-4 ml-1" />
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

      {/* ═══════════════════════════════════════════════════════════
          F. FEATURES / TRUST SECTION — Key Benefits Cards
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">Why Choose Us</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              Key{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Benefits</span>
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
                    {/* Animated stat icon */}
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-glow"
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

      {/* ═══════════════════════════════════════════════════════════
          G. TESTIMONIALS SECTION
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-28 bg-[#f4f3f0] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-14">
            <Badge className="mb-4 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">Testimonials</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              What Our{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Users Say</span>
            </h2>
            <p className="text-[#88837b] text-base sm:text-lg max-w-2xl mx-auto">
              Real stories from people who have made NOTJUST WATER part of their daily wellness routine.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Priya S.', role: 'Working Professional', text: 'I take NOTJUST before lunch every day. My post-meal energy crashes have reduced significantly. It fits perfectly into my busy schedule.', rating: 5, color: '#48805b' },
              { name: 'Dr. Rajesh M.', role: 'General Physician', text: 'As a doctor, I appreciate the science behind NOTJUST. Slowing gastric emptying is a well-researched approach to glycemic management.', rating: 5, color: '#afb75d' },
              { name: 'Anita K.', role: 'Yoga Instructor', text: 'I recommend NOTJUST to my students. The 50 ml shot is convenient and the natural ingredients align with our wellness philosophy.', rating: 5, color: '#2e91b2' },
            ].map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-7 border border-[#e3dfd8] hover:shadow-xl hover:shadow-[#48805b]/8 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
                  {/* Quote mark decoration */}
                  <div className="absolute top-4 right-5 text-[#48805b]/8 pointer-events-none select-none" aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7.05C9.05 8.03 7.5 9.53 7.5 11.5c0 1.33.67 2 1.5 2 .83 0 1.5-.67 1.5-1.5 0-.83-.67-1.5-1.5-1.5-.17 0-.33.03-.5.08.33-1.17 1.33-2.17 2.5-2.83L11 7.05zM17 7.05c-1.95.98-3.5 2.48-3.5 4.45 0 1.33.67 2 1.5 2 .83 0 1.5-.67 1.5-1.5 0-.83-.67-1.5-1.5-1.5-.17 0-.33.03-.5.08.33-1.17 1.33-2.17 2.5-2.83L17 7.05z"/></svg>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#afb75d] text-[#afb75d]" />
                    ))}
                  </div>
                  <p className="text-[#1f1e1c]/80 text-sm leading-relaxed flex-1 mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#e3dfd8]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-bold text-sm" style={{ backgroundColor: t.color }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm text-[#1f1e1c]">{t.name}</p>
                      <p className="text-xs text-[#88837b]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          H. STATS / COUNTER SECTION — dark bg
          ═══════════════════════════════════════════════════════════ */}
      {/* Trust / Marquee Bar */}
      <div className="py-10 bg-[#1f1e1c] overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex items-center gap-8">
              {['Apollo Hospitals', 'Taj Hotels', 'Infosys Wellness', 'Fortis Healthcare', 'Columbia Asia', 'Manipal Hospitals', 'Soul Spa', 'Dr. Batras'].map((name, idx) => (
                <div key={`${setIdx}-${idx}`} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg bg-[#48805b]/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#afb75d]" />
                  </div>
                  <span className="text-white/50 text-sm font-heading font-medium">{name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <AnimatedSection className="py-20 md:py-28 bg-[#1f1e1c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: 10000, suffix: '+', label: 'Users', icon: Users },
              { value: 50, suffix: '+', label: 'Partners', icon: Globe },
              { value: 98, suffix: '%', label: 'Satisfaction', icon: Star },
              { value: 40, suffix: '%', label: 'Spike Reduction', icon: TrendingUp },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-[#48805b]/15 flex items-center justify-center mx-auto mb-5 animate-pulse-glow">
                  <stat.icon className="w-6 h-6 text-[#48805b]" />
                </div>
                <p className="font-heading text-4xl sm:text-5xl font-extralight text-white mb-2 tracking-tight">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          I. FAQ SECTION
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-28 bg-[#f4f3f0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-14">
            <Badge className="mb-4 bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs font-semibold tracking-wider uppercase">FAQ</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              Frequently Asked{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Questions</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {[
              { q: 'What is NOTJUST WATER™?', a: 'NOTJUST WATER™ is a 50 ml pre-meal wellness shot designed to help reduce the Glycemic Index (GI) impact of carbohydrate-rich foods when taken before meals.' },
              { q: 'How do I take it?', a: "Simply drink one 50 ml shot 10-15 minutes before your meal. It's ready-to-drink and requires no preparation." },
              { q: 'Is it safe for daily use?', a: 'Yes, NOTJUST WATER™ is formulated with natural ingredients and is safe for daily use as part of a balanced lifestyle. Consult your healthcare provider if you have specific medical conditions.' },
              { q: "What's the difference between Fizz and Still?", a: 'NOTJUST Watr Fizz is the carbonated variant offering a refreshing sparkling experience, while NOTJUST Watr Still is the non-carbonated version for those who prefer a smooth, still beverage.' },
              { q: 'How many shots are in a pack?', a: 'Each pack contains 14 × 50 ml shots, designed for two weeks of daily use (one shot per meal).' },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <details className="group bg-white rounded-xl border border-[#e3dfd8] overflow-hidden hover:border-[#48805b]/30 transition-all duration-300">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-heading font-semibold text-sm text-[#1f1e1c] hover:text-[#48805b] transition-all duration-300 list-none">
                    {faq.q}
                    <ChevronDown className="w-4 h-4 text-[#88837b] group-open:rotate-180 transition-transform duration-500 flex-shrink-0 ml-4" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[#88837b] leading-relaxed border-t border-[#e3dfd8] pt-4">
                    {faq.a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          J. OUR JOURNEY TEASER — Dark background
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="relative py-24 md:py-32 overflow-hidden bg-[#1f1e1c]">
        {/* Background blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute w-40 h-40 rounded-full bg-[#48805b]/8 blur-3xl" style={{ left: '5%', top: '20%', animation: 'cta-float-1 8s ease-in-out infinite' }} />
          <div className="absolute w-32 h-32 rounded-full bg-[#afb75d]/8 blur-2xl" style={{ right: '10%', bottom: '15%', animation: 'cta-float-2 10s ease-in-out infinite' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp}>
            <Badge className="mb-6 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">
              <Globe className="w-3 h-3 mr-1.5" /> Our Journey
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-white mb-6 leading-tight tracking-tight">
              From Science to{' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d]">Wellness</span>
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover how NOTJUST WATER™ was born from a passion for making glycemic management
              accessible, convenient, and part of everyday life.
            </p>
            <Button
              size="lg"
              onClick={() => navigateTo('our-journey')}
              className="bg-[#afb75d] hover:bg-[#9aa34e] text-[#1f1e1c] font-heading font-semibold text-sm px-10 py-6 rounded-full shadow-xl shadow-[#afb75d]/20 hover:shadow-2xl transition-all duration-300 min-h-[44px]"
            >
              Discover Our Story <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          K. CTA SECTION — dark with image overlay
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/product-shot.png" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#1f1e1c]/90" />
        </div>
        {/* Animated floating particles */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute w-32 h-32 rounded-full bg-[#48805b]/10 blur-2xl" style={{ left: '10%', top: '20%', animation: 'cta-float-1 8s ease-in-out infinite' }} />
          <div className="absolute w-24 h-24 rounded-full bg-[#afb75d]/10 blur-xl" style={{ right: '15%', top: '30%', animation: 'cta-float-2 10s ease-in-out infinite' }} />
          <div className="absolute w-20 h-20 rounded-full bg-[#2e91b2]/8 blur-xl" style={{ left: '60%', bottom: '20%', animation: 'cta-float-3 9s ease-in-out infinite' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-white mb-6 leading-tight tracking-tight">
              Enjoy Your Favorite Foods<br />
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d]">Smarter.</span>
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              NOTJUST WATER™ is a simple pre-meal wellness shot designed to support better
              glycemic management as part of a balanced lifestyle.
            </p>
            <Button
              size="lg"
              onClick={() => {
                if (!user) { navigateTo('auth-login'); toast.info('Please sign in to get started'); return }
                navigateTo('products')
              }}
              className="bg-[#e3dfd8] hover:bg-white text-[#1f1e1c] font-heading font-bold text-sm px-10 py-6 rounded-full shadow-xl shadow-black/20 hover:shadow-2xl transition-all duration-300 min-h-[44px]"
            >
              Get Started Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          L. FOOTER — Sticky bottom, dark, 4-column
          ═══════════════════════════════════════════════════════════ */}
      <footer className="mt-auto bg-[#1f1e1c] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={140} height={48} className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                NOTJUST WATER™ is a 50 ml pre-meal wellness shot designed to help lower the glycemic impact of your meal.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><button onClick={() => navigateTo('landing')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center">Home</button></li>
                <li><button onClick={() => scrollToSection('product-carousel')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center">Products</button></li>
                <li><button onClick={() => navigateTo('our-journey')} className="hover:text-white transition-colors duration-300 min-h-[44px] flex items-center">Our Journey</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li>
                  <button className="flex items-center gap-2 hover:text-[#25D366] transition-colors min-h-[44px]" onClick={() => window.open('https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}>
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 hover:text-[#2e91b2] transition-colors min-h-[44px]" onClick={() => window.open('mailto:hello@notjust.health?subject=Query%20about%20NOTJUST%20Watr', '_blank')}>
                    <Mail className="w-3.5 h-3.5" /> hello@notjust.health
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 hover:text-[#48805b] transition-colors min-h-[44px]" onClick={() => window.open('sms:+919876543210?body=Hi%2C%20I%20have%20a%20question%20about%20NOTJUST%20Watr', '_blank')}>
                    <Smartphone className="w-3.5 h-3.5" /> SMS +91 98765 43210
                  </button>
                </li>
                <li className="flex items-center gap-2 min-h-[44px]"><MapPin className="w-3.5 h-3.5" /> Mumbai, India</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Follow Us</h4>
              <div className="flex gap-2.5">
                {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 hover:bg-[#48805b] hover:text-white transition-all duration-300 min-[44px]" aria-label={`Follow us on social media`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-white/30 font-medium mb-1">POWERED BY</p>
                <p className="text-xs text-white/50">Zoho Mail · Zoho SMS</p>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-white/[0.06]" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
            <p>&copy; 2026 NotJust Health. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-white/60 cursor-pointer transition-colors duration-300">Privacy Policy</span>
              <span className="hover:text-white/60 cursor-pointer transition-colors duration-300">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
