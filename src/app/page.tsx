'use client'

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ChevronDown, ChevronLeft, Menu, X, ShoppingCart, User, LogOut, Shield, Play,
  CheckCircle, Lock, ArrowRight, ArrowLeft, Minus, Plus, Trash2,
  QrCode, BookOpen, Users, BarChart3, Settings, FileText, Package,
  TrendingUp, Eye, Clock, MapPin, Smartphone, Star, Award,
  Heart, Zap, Leaf, ChevronRight, Home, Scan, GraduationCap,
  Store, ClipboardList, MessageSquare, RefreshCw, Search,
  Filter, Download, MoreVertical, AlertCircle, Info, ChevronUp,
  DollarSign, Activity, PieChart, BarChart, Globe, Mail, Phone as PhoneIcon,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Send,
  LayoutDashboard, CreditCard, Truck, Kanban, Columns3, Tag, Copy, ExternalLink, Utensils, Save, Edit, EyeOff,
  Upload, Check, Sparkles, Layers, ArrowUpRight
} from 'lucide-react'
import { useAppStore, type AppView, type CartItem } from '@/store/app-store'
import {
  authService, campaignService, learningService, quizService,
  productService, orderService, adminStatsService, userService,
  qrScanService, initDataService, isUsingRealSupabase,
  productVideoService, productQuizService, productLearningService,
  subscriptionService, reorderReminderService
} from '@/lib/data-service'
import type {
  UserProfile, Campaign, QrScan, LearningProgress, QuizQuestion,
  Product, Order, OrderItem,
  ProductVideo, ProductQuiz, ProductLearningProgress, Subscription, ReorderReminder
} from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  PieChart as RechartsPieChart, Pie, Cell, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ProductLearningModule } from '@/components/ProductLearningModule'
import { SubscriptionView, SubscriptionSelector } from '@/components/SubscriptionModule'

// ============================================================
// BRAND CONSTANTS
// ============================================================
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
}

const CHART_COLORS = [BRAND.green, BRAND.lime, BRAND.blue, BRAND.muted, BRAND.dark]

// ============================================================
// ANIMATION VARIANTS
// ============================================================
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
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
}

// ============================================================
// SECTION WRAPPER WITH SCROLL ANIMATION
// ============================================================
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

// ============================================================
// COUNTER ANIMATION COMPONENT
// ============================================================
function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, end])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

// ============================================================
// DATABASE STATUS BADGE
// ============================================================
function DbStatusBadge({ isHero }: { isHero: boolean }) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'mock'>('checking')

  useEffect(() => {
    initDataService().then((connected) => {
      setStatus(connected ? 'connected' : 'mock')
    })
  }, [])

  return (
    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide transition-all duration-300 ${
      isHero
        ? status === 'connected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        : status === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        status === 'checking' ? 'bg-gray-400 animate-pulse' : status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
      }`} />
      {status === 'checking' ? 'DB...' : status === 'connected' ? 'Supabase' : 'Mock DB'}
    </div>
  )
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar() {
  const { currentView, navigateTo, user, setUser, cart, goBack } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLanding = currentView === 'landing'
  const isHero = isLanding && !scrolled

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = () => {
    setUser(null)
    navigateTo('landing')
    toast.success('Logged out successfully')
  }

  const navLinks = [
    { label: 'Home', view: 'landing' as AppView, icon: Home },
    { label: 'Learn', view: 'learning' as AppView, icon: GraduationCap },
    { label: 'Products', view: 'products' as AppView, icon: Store },
    { label: 'My Subs', view: 'subscriptions' as AppView, icon: CreditCard },
  ]

  const adminLinks = [
    { label: 'Dashboard', view: 'admin-dashboard' as AppView, icon: BarChart3 },
    { label: 'Users', view: 'admin-users' as AppView, icon: Users },
    { label: 'Campaigns', view: 'admin-campaigns' as AppView, icon: MegaphoneIcon },
    { label: 'Products', view: 'admin-products' as AppView, icon: Store },
    { label: 'Orders', view: 'admin-orders' as AppView, icon: Package },
    { label: 'Subscriptions', view: 'admin-subscriptions' as AppView, icon: CreditCard },
    { label: 'Analytics', view: 'admin-analytics' as AppView, icon: TrendingUp },
    { label: 'Content', view: 'admin-content' as AppView, icon: FileText },
  ]

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isHero
          ? 'bg-transparent'
          : isLanding && scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
            : 'bg-white/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button onClick={() => navigateTo('landing')} className="flex items-center gap-2 cursor-pointer group">
            <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={120} height={40} className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </button>

          {/* Center Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.view}
                onClick={() => {
                  if (!user && link.view !== 'landing') {
                    navigateTo('auth-login')
                    toast.info('Please login first')
                    return
                  }
                  navigateTo(link.view)
                }}
                className={`relative px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 ${
                  currentView === link.view
                    ? isHero
                      ? 'bg-white/15 text-white'
                      : 'bg-[#48805b]/10 text-[#48805b]'
                    : isHero
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-[#88837b] hover:text-[#1f1e1c] hover:bg-[#e3dfd8]/60'
                }`}
              >
                {link.label}
              </button>
            ))}
            {user?.is_admin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`px-4 py-2 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 flex items-center gap-1.5 ${
                    currentView.startsWith('admin')
                      ? isHero
                        ? 'bg-white/15 text-white'
                        : 'bg-[#48805b]/10 text-[#48805b]'
                      : isHero
                        ? 'text-white/70 hover:text-white hover:bg-white/10'
                        : 'text-[#88837b] hover:text-[#1f1e1c] hover:bg-[#e3dfd8]/60'
                  }`}>
                    Admin <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-[#e3dfd8]/80">
                  {adminLinks.map(link => (
                    <DropdownMenuItem key={link.view} onClick={() => navigateTo(link.view)} className="rounded-lg">
                      <link.icon className="w-4 h-4 mr-2 text-[#88837b]" />
                      {link.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Supabase Status Indicator */}
            <DbStatusBadge isHero={isHero} />

            {user ? (
              <>
                {/* Cart */}
                <button
                  onClick={() => navigateTo('cart')}
                  className={`relative p-2.5 rounded-full transition-all duration-300 ${
                    isHero
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-[#88837b] hover:text-[#1f1e1c] hover:bg-[#e3dfd8]/60'
                  }`}
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#afb75d] text-[#1f1e1c] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all duration-300 ${
                      isHero ? 'hover:bg-white/10' : 'hover:bg-[#e3dfd8]/60'
                    }`}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#48805b] to-[#afb75d] flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/20">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`hidden sm:block text-sm font-medium transition-colors duration-500 ${isHero ? 'text-white/90' : 'text-[#1f1e1c]'}`}>
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-colors duration-500 ${isHero ? 'text-white/50' : 'text-[#88837b]'}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-[#e3dfd8]/80">
                    <DropdownMenuItem onClick={() => navigateTo('profile')} className="rounded-lg">
                      <User className="w-4 h-4 mr-2 text-[#88837b]" /> Profile
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem onClick={() => navigateTo('admin-dashboard')} className="rounded-lg">
                        <Shield className="w-4 h-4 mr-2 text-[#88837b]" /> Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-lg">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => navigateTo('auth-login')}
                className={`font-heading font-semibold text-[13px] tracking-wide rounded-full px-5 h-10 transition-all duration-300 ${
                  isHero
                    ? 'bg-[#e3dfd8] text-[#1f1e1c] hover:bg-white hover:shadow-lg hover:shadow-white/10'
                    : 'bg-[#48805b] text-white hover:bg-[#3a6a4a] shadow-sm'
                }`}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className={`md:hidden p-2.5 rounded-full transition-all duration-300 ${
                  isHero ? 'text-white hover:bg-white/10' : 'text-[#1f1e1c] hover:bg-[#e3dfd8]/60'
                }`}>
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-[#e3dfd8]/60">
                    <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={34} className="h-8 w-auto object-contain" />
                  </div>

                  {/* Mobile Nav */}
                  <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navLinks.map(link => (
                      <button
                        key={link.view}
                        onClick={() => {
                          if (!user && link.view !== 'landing') { navigateTo('auth-login'); toast.info('Please login first'); }
                          else navigateTo(link.view)
                          setMobileOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          currentView === link.view
                            ? 'bg-[#48805b]/10 text-[#48805b]'
                            : 'text-[#1f1e1c] hover:bg-[#e3dfd8]/50'
                        }`}
                      >
                        <link.icon className="w-4 h-4" /> {link.label}
                      </button>
                    ))}
                    {user?.is_admin && (
                      <>
                        <Separator className="my-3" />
                        <p className="px-4 py-1 text-[10px] font-semibold text-[#88837b] uppercase tracking-widest">Admin</p>
                        {adminLinks.map(link => (
                          <button
                            key={link.view}
                            onClick={() => { navigateTo(link.view); setMobileOpen(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1f1e1c] hover:bg-[#e3dfd8]/50 transition-colors"
                          >
                            <link.icon className="w-4 h-4 text-[#88837b]" /> {link.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="px-4 py-4 border-t border-[#e3dfd8]/60 space-y-1">
                    {user ? (
                      <>
                        <button onClick={() => { navigateTo('cart'); setMobileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1f1e1c] hover:bg-[#e3dfd8]/50">
                          <ShoppingCart className="w-4 h-4" /> Cart {cartCount > 0 && <Badge className="bg-[#afb75d] text-[#1f1e1c] text-[10px] ml-auto">{cartCount}</Badge>}
                        </button>
                        <button onClick={() => { navigateTo('profile'); setMobileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1f1e1c] hover:bg-[#e3dfd8]/50">
                          <User className="w-4 h-4" /> Profile
                        </button>
                        <button onClick={() => { handleLogout(); setMobileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </>
                    ) : (
                      <Button onClick={() => { navigateTo('auth-login'); setMobileOpen(false) }} className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl h-12">
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

function MegaphoneIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage() {
  const { navigateTo, user, setSelectedProductId } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    productService.getAll().then(r => r.data && setProducts(r.data))
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const heroProducts = products.slice(0, 4)

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════
          A. HERO SECTION — housewine.nl style dark hero with gradient blobs
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#1f1e1c]">
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
                  <Zap className="w-3 h-3 mr-1.5" /> NOTJUST WATER(TM)
                </Badge>
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="font-heading text-[clamp(2.25rem,4vw+1rem,4.25rem)] font-extralight text-white leading-[1.05] tracking-tight mb-6"
              >
                Lower the{' '}
                <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d] inline-block animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, #afb75d 0%, #d4da8a 25%, #afb75d 50%, #d4da8a 75%, #afb75d 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Glycemic Impact</span>
                <br />
                of Your Meal
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-white/60 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                NOTJUST WATER(TM) is a convenient 50 ml pre-meal shot designed to help reduce the
                Glycemic Index (GI) impact of carbohydrate-rich foods. Simply take one shot before your
                meal to support a healthier glycemic response and help manage post-meal blood sugar spikes.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={() => {
                    if (!user) { navigateTo('auth-login'); toast.info('Please login first'); return }
                    navigateTo('learning')
                  }}
                  className="bg-[#e3dfd8] hover:bg-white text-[#1f1e1c] font-heading font-semibold text-sm px-7 py-5 rounded-full shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-300"
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('how-it-works')}
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:border-white/50 font-heading font-semibold text-sm px-7 py-5 rounded-full backdrop-blur-sm transition-all duration-300"
                >
                  Learn More <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-5 text-white/50 text-xs font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-[#afb75d]" /> Supports Blood Sugar Management</div>
                <div className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-[#afb75d]" /> 50 ml Ready-to-Drink Shot</div>
                <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#afb75d]" /> 10-15 Minutes Before Meals</div>
              </motion.div>
            </motion.div>

            {/* RIGHT - Diagonal hero product cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="relative h-[620px] max-w-xl ml-auto">
                {heroProducts.slice(0, 2).map((product, idx) => {
                  const isSecond = idx === 1
                  return (
                    <div
                      key={product.id}
                      className={`card-reveal absolute w-[280px] bg-[#302f2c] rounded-xl overflow-hidden ring-1 ring-white/[0.12] shadow-2xl shadow-black/30 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:ring-[#afb75d]/40 ${isSecond ? 'right-0 top-[270px]' : 'left-0 top-0'}`}
                      style={{ animationDelay: `${0.1 + idx * 0.2}s` }}
                      onClick={() => {
                        if (!user) { navigateTo('auth-login'); toast.info('Please login first'); return }
                        navigateTo('products')
                      }}
                    >
                      <div className="relative h-[250px] bg-gradient-to-b from-[#1a1917] to-[#2a2926] overflow-hidden">
                        <Image src={product.image_url || (product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')} alt={product.name} fill className="object-contain group-hover:scale-105 transition-transform duration-500 p-4" />
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/35 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                          {isSecond ? 'Still' : 'Carbonated'}
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
            </motion.div>          </div>
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
                {/* Fizz bottle - left */}
                <div className="relative flex-1 h-full">
                  <Image src="/images/product-fizz.webp" alt="NotJust Watr Fizz" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain" />
                </div>
                {/* Still bottle - right */}
                <div className="relative flex-1 h-full">
                  <Image src="/images/product-still.webp" alt="NotJust Watr Still" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain" />
                </div>
              </div>
              <div className="absolute -bottom-5 -right-5 bg-gradient-to-br from-[#48805b] to-[#3a6a4a] rounded-2xl px-6 py-5 text-white shadow-2xl shadow-black/30">
                <p className="font-heading text-3xl font-bold">40%</p>
                <p className="text-xs text-white/70 font-medium">Spike Reduction</p>
              </div>
            </motion.div>
            <motion.div variants={slideInRight}>
              <Badge className="mb-4 bg-[#afb75d]/15 text-[#afb75d] border-[#afb75d]/25 text-xs font-semibold tracking-wider uppercase">NOTJUST WATER(TM)</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-white mb-6 leading-[1.1] tracking-tight">
                Enjoy Your Favorite Foods<br />
                <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d]">Smarter.</span>
              </h2>
              <p className="text-white/50 text-base sm:text-lg mb-8 leading-relaxed">
                A simple pre-meal wellness solution designed to support better glycemic management as
                part of a balanced lifestyle. Take one 50 ml shot before your meal to make carbohydrate-rich
                foods easier to manage as part of your daily routine.
              </p>
              <div className="grid gap-3">
                {[
                  { icon: CheckCircle, title: 'Helps Reduce GI Impact', desc: 'Designed for carbohydrate-rich meals' },
                  { icon: Heart, title: 'Blood Sugar Support', desc: 'Supports healthier post-meal response' },
                  { icon: Package, title: '14 x 50 ml Shots', desc: 'Ready-to-drink pack for daily use' },
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
            {/* ── Animated dashed line (desktop) ── */}
            <div className="hidden lg:block absolute top-[48px] left-[14%] right-[14%]">
              {/* Background dashed line */}
              <div className="h-0 border-t-2 border-dashed border-[#c5c0b8]" />
              {/* Animated progress fill — travels from left to right */}
              <motion.div
                className="absolute top-0 left-0 h-0 border-t-2 border-[#48805b]"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
              />
              {/* Traveling dot on the line */}
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
                {
                  num: '01', icon: Package, title: 'Open',
                  desc: 'Keep your 14 x 50 ml shot pack ready before meals.',
                  color: '#48805b', badge: 'Pack of 14', badgeIcon: Package,
                },
                {
                  num: '02', icon: Clock, title: 'Take',
                  desc: 'Drink one 50 ml shot 10-15 minutes before your meal.',
                  color: '#48805b', badge: 'Pre-Meal', badgeIcon: Clock,
                },
                {
                  num: '03', icon: Utensils, title: 'Eat',
                  desc: 'Enjoy your carbohydrate-rich foods as part of a balanced lifestyle.',
                  color: '#48805b', badge: 'Daily Routine', badgeIcon: Utensils,
                },
                {
                  num: '04', icon: TrendingUp, title: 'Support',
                  desc: 'Help manage post-meal blood sugar spikes and glycemic response.',
                  color: '#48805b', badge: 'Smarter Meals', badgeIcon: TrendingUp,
                },
              ].map((step, idx) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.25, ease: 'easeOut' }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* ── Rounded Square Icon ── */}
                  <motion.div
                    className="relative z-10 mb-5"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 + idx * 0.25 }}
                  >
                    <div
                      className="w-[88px] h-[88px] rounded-2xl text-white flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:rounded-3xl"
                      style={{ backgroundColor: step.color, boxShadow: `0 8px 24px ${step.color}30` }}
                    >
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 }}
                      >
                        <step.icon className="w-8 h-8" />
                      </motion.div>
                    </div>
                    {/* Step number badge */}
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
                      style={{ backgroundColor: step.color }}
                    >
                      {step.num}
                    </div>
                  </motion.div>

                  {/* ── Title ── */}
                  <motion.h3
                    className="font-heading text-lg font-bold text-[#1f1e1c] mb-1.5 transition-colors duration-300 group-hover:text-[#48805b]"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.25 }}
                  >
                    {step.title}
                  </motion.h3>

                  {/* ── Description ── */}
                  <motion.p
                    className="text-[#88837b] text-sm leading-relaxed max-w-[240px] min-h-[48px] mx-auto mb-3 transition-colors duration-300 group-hover:text-[#1f1e1c]/70"
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.25 }}
                  >
                    {step.desc}
                  </motion.p>

                  {/* ── Benefit Badge ── */}
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
                <p className="text-white/60 text-sm mb-6">See how NOTJUST WATER(TM) supports a healthier post-meal response.</p>
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
                NOTJUST WATER(TM) helps reduce the GI impact of meals, supports healthy blood sugar
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
          E. PRODUCTS SECTION — light bg, full product cards
          ═══════════════════════════════════════════════════════════ */}
      <AnimatedSection className="py-20 md:py-28 bg-[#f4f3f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs font-semibold tracking-wider uppercase">Our Products</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-[#1f1e1c] mb-4 leading-tight tracking-tight">
              NOTJUST WATER(TM){' '}
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#48805b]">Pre-Meal Wellness Shot</span>
            </h2>
            <p className="text-[#88837b] text-base sm:text-lg max-w-2xl mx-auto">
              Choose from NOTJUST Watr Fizz or NOTJUST Watr Still, with monthly and eco-friendly refill purchase options.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-12">
            <div className="rounded-xl border border-[#e7b973]/40 bg-[#fff7ea] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#e7b973]/20 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 text-[#b56b20]" />
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

          <div className="grid gap-8 max-w-6xl mx-auto">
            {products.map((product, idx) => {
              const isStill = idx === 1
              const discount = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0
              const highlightItems = product.highlights ? product.highlights.split(',').map(h => h.trim()) : []
              const visibleHighlights = highlightItems.slice(0, 3)
              const moreCount = highlightItems.length - 3
              return (
                <motion.div key={product.id} variants={scaleIn}>
                  <Card className="border-[#3c3a35] bg-[#262520] text-white overflow-hidden rounded-2xl shadow-2xl shadow-black/15 hover:shadow-3xl hover:shadow-black/20 transition-shadow duration-500">
                    <div className={`grid lg:grid-cols-2 min-h-[420px] ${isStill ? 'lg:[&>div:first-child]:order-2' : ''}`}>
                      {/* Image side */}
                      <div className="relative min-h-[280px] lg:min-h-full overflow-hidden bg-[#1f1e1c]">
                        <Image src={product.image_url || (product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')} alt={product.name} fill className="object-contain p-8" />
                        {/* Gradient overlay at bottom for text contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1e1c]/80 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#262520]/25" />
                        {/* Bottom-left badges */}
                        <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white">
                            {isStill ? 'Still Variant' : 'Fizz Variant'}
                          </span>
                          {discount > 0 && (
                            <span className="rounded-full bg-[#48805b] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        {/* Featured badge */}
                        {product.featured && (
                          <div className="absolute top-5 right-5">
                            <span className="rounded-full bg-[#e7b973] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" /> Featured
                            </span>
                          </div>
                        )}
                        {/* Discount label badge (top-left) */}
                        {product.discount_label && (
                          <div className="absolute top-5 left-5">
                            <span className="rounded-full bg-[#afb75d] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#afb75d]/20">
                              {product.discount_label}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Content side */}
                      <div className="p-7 lg:p-10 flex flex-col justify-center">
                        {/* Brand + Type row */}
                        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                          {product.brand && (
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 border border-white/15 rounded-full px-3 py-1 bg-white/[0.03]">
                              {product.brand}
                            </span>
                          )}
                          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#48805b]">{product.type} Variant</p>
                          {product.category && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2e91b2]/20 text-[#2e91b2]">{product.category}</span>
                          )}
                          {/* Flavor chip */}
                          {product.flavor && (
                            <span className="text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-[#afb75d]/15 text-[#afb75d] border border-[#afb75d]/25">
                              {product.flavor}
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading text-3xl text-white mb-2 leading-tight">{product.name}</h3>
                        {product.short_description && (
                          <p className="text-[#afb75d] text-sm font-medium mb-3">{product.short_description}</p>
                        )}
                        <p className="text-sm sm:text-base text-white/45 leading-relaxed max-w-xl">{product.description}</p>
                        <div className="grid grid-cols-3 gap-3 my-7 max-w-md">
                          {[
                            { value: product.weight ? product.weight.split(',')[0]?.trim() : '14 shots', label: 'Per pack' },
                            { value: '50 ml', label: 'Per shot' },
                            { value: '0 cal', label: 'Zero calorie' },
                          ].map(stat => (
                            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                              <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                              <p className="text-[10px] uppercase tracking-wide text-white/30 mt-2">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                        {/* Highlights as checkmark items */}
                        {visibleHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {visibleHighlights.map((h, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#48805b]/25 bg-[#48805b]/10 text-[#48805d]">
                                <CheckCircle className="w-3 h-3 text-[#48805b]" />{h}
                              </span>
                            ))}
                            {moreCount > 0 && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/10 bg-white/[0.04] text-white/50">
                                +{moreCount} more
                              </span>
                            )}
                          </div>
                        )}
                        {/* Tags */}
                        {product.tags && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {product.tags.split(',').map((tag, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/10 bg-white/[0.04] text-white/50">{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                        {/* Price + CTA row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <p className="font-heading text-4xl text-white">₹{product.price.toLocaleString()}</p>
                              {product.mrp && product.mrp > product.price && (
                                <p className="text-lg line-through text-white/30">₹{product.mrp.toLocaleString()}</p>
                              )}
                            </div>
                            <p className="text-xs text-white/35 mt-1">incl. tax {discount > 0 && `· Save ₹${(product.mrp! - product.price).toLocaleString()}`}</p>
                          </div>
                          {user?.learning_completed ? (
                            <Button className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-full text-sm px-7" onClick={() => navigateTo('products')}>
                              View Details <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button variant="outline" className="border-white/20 bg-white/10 text-white/70 font-heading font-semibold rounded-full text-sm px-5" disabled>
                                <Lock className="w-4 h-4 mr-1.5" /> Locked
                              </Button>
                              <Button className="bg-[#afb75d] hover:bg-[#9aa34e] text-[#1f1e1c] font-heading font-semibold rounded-full text-sm px-5 shadow-lg shadow-[#afb75d]/20" onClick={() => {
                                setSelectedProductId(product.id)
                                if (!user) { navigateTo('auth-login'); toast.info('Please login to unlock'); return }
                                navigateTo('product-learning')
                              }}>
                                <GraduationCap className="w-4 h-4 mr-1.5" /> Unlock
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* FSSAI badge */}
                        {product.fssai_license && (
                          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-[10px] text-white/30 tracking-wide">FSSAI Lic. {product.fssai_license}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>        </div>
      </AnimatedSection>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          G. STATS / COUNTER SECTION â€” dark bg
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {/* TESTIMONIALS SECTION */}
      <AnimatedSection className="py-20 md:py-28 bg-white overflow-hidden">
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
                <div className="bg-[#f4f3f0] rounded-2xl p-7 border border-[#e3dfd8] hover:shadow-xl hover:shadow-[#48805b]/8 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
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

      {/* TRUST / MARQUEE BAR */}
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
                <p className="font-heading text-4xl sm:text-5xl font-extralight text-white mb-2 tracking-tight animate-pulse" style={{ animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>
      {/* ═══════════════════════════════════════════════════════════
          H1. FAQ SECTION — light bg, accordion style
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
              { q: 'What is NOTJUST WATER(TM)?', a: 'NOTJUST WATER(TM) is a 50 ml pre-meal wellness shot designed to help reduce the Glycemic Index (GI) impact of carbohydrate-rich foods when taken before meals.' },
              { q: 'How do I take it?', a: "Simply drink one 50 ml shot 10-15 minutes before your meal. It\u0027s ready-to-drink and requires no preparation." },
              { q: 'Is it safe for daily use?', a: 'Yes, NOTJUST WATER(TM) is formulated with natural ingredients and is safe for daily use as part of a balanced lifestyle. Consult your healthcare provider if you have specific medical conditions.' },
              { q: "What\u0027s the difference between Fizz and Still?", a: 'NOTJUST Watr Fizz is the carbonated variant offering a refreshing sparkling experience, while NOTJUST Watr Still is the non-carbonated version for those who prefer a smooth, still beverage.' },
              { q: 'How many shots are in a pack?', a: 'Each pack contains 14 x 50 ml shots, designed for two weeks of daily use (one shot per meal).' },
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
                  <div className="px-5 pb-5 text-sm text-[#88837b] leading-relaxed border-t border-[#e3dfd8] pt-4 group-open:animate-[fadeIn_0.3s_ease-out]">
                    {faq.a}
                  </div>
                </details>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          H. CTA SECTION — dark with image overlay
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
          <div className="absolute w-16 h-16 rounded-full bg-[#afb75d]/8 blur-lg" style={{ left: '25%', bottom: '30%', animation: 'cta-float-1 7s ease-in-out infinite 2s' }} />
          <div className="absolute w-12 h-12 rounded-full bg-[#48805b]/10 blur-lg" style={{ right: '30%', bottom: '40%', animation: 'cta-float-2 11s ease-in-out infinite 1s' }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extralight text-white mb-6 leading-tight tracking-tight">
              Enjoy Your Favorite Foods<br />
              <span className="font-[family-name:var(--font-display)] italic font-light text-[#afb75d]">Smarter.</span>
            </h2>
            <p className="text-white/50 text-base sm:text-lg mb-10 max-w-xl mx-auto">
              NOTJUST WATER(TM) is a simple pre-meal wellness shot designed to support better
              glycemic management as part of a balanced lifestyle.
            </p>
            <Button
              size="lg"
              onClick={() => {
                if (!user) { navigateTo('auth-login'); toast.info('Please sign in to get started'); return }
                navigateTo('learning')
              }}
              className="bg-[#e3dfd8] hover:bg-white text-[#1f1e1c] font-heading font-bold text-sm px-10 py-6 rounded-full shadow-xl shadow-black/20 hover:shadow-2xl transition-all duration-300"
            >
              Get Started Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════════════════════════════════════════════════════
          I. FOOTER — dark, 4-column
          ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#1f1e1c] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={140} height={48} className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                NOTJUST WATER(TM) is a 50 ml pre-meal wellness shot designed to help lower the glycemic impact of your meal.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><button onClick={() => navigateTo('landing')} className="hover:text-white transition-colors duration-300">Home</button></li>
                <li><button onClick={() => navigateTo('learning')} className="hover:text-white transition-colors duration-300">Learning</button></li>
                <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors duration-300">Products</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> hello@notjust.health</li>
                <li className="flex items-center gap-2"><PhoneIcon className="w-3.5 h-3.5" /> +91 98765 43210</li>
                <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Mumbai, India</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white text-sm mb-4">Follow Us</h4>
              <div className="flex gap-2.5">
                {[Instagram, Twitter, Linkedin, Youtube].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 hover:bg-[#48805b] hover:text-white transition-all duration-300">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
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

// ============================================================
// AUTH VIEWS
// ============================================================
function AuthLogin() {
  const { navigateTo, setPendingOtp } = useAppStore()
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    const contact = loginType === 'phone' ? phone : email
    if (!contact) { toast.error('Please enter your ' + loginType); return }
    setLoading(true)
    try {
      const result = loginType === 'phone'
        ? await authService.loginWithPhone(contact)
        : await authService.loginWithEmail(contact)
      if (result.error) { toast.error(String(result.error)); return }
      setPendingOtp(contact, loginType)
      navigateTo('auth-otp')
      toast.success('OTP sent! Use 123456 for demo')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-16 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={34} className="h-9 w-auto object-contain" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue your wellness journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Toggle */}
            <div className="flex bg-[#e3dfd8] rounded-lg p-1">
              <button
                onClick={() => setLoginType('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  loginType === 'phone' ? 'bg-white shadow text-[#1f1e1c]' : 'text-[#88837b]'
                }`}
              >
                Phone
              </button>
              <button
                onClick={() => setLoginType('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  loginType === 'email' ? 'bg-white shadow text-[#1f1e1c]' : 'text-[#88837b]'
                }`}
              >
                Email
              </button>
            </div>

            {loginType === 'phone' ? (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
            )}

            <Button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>

            <div className="text-center text-sm text-[#88837b]">
              <p>Demo: Use <strong>admin@notjust.com</strong> or <strong>+919876543210</strong></p>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              Don&apos;t have an account?{' '}
              <button onClick={() => navigateTo('auth-register')} className="text-[#48805b] font-semibold hover:underline">
                Register
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

function AuthRegister() {
  const { navigateTo, setPendingOtp } = useAppStore()
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '', email: '', country: 'India', state: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return }
    setLoading(true)
    try {
      const result = await authService.register({
        name: form.name,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        phone: form.phone,
        email: form.email || undefined,
        country: form.country,
        state: form.state || undefined,
      })
      if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Registration failed'); return }
      setPendingOtp(form.phone, 'phone')
      navigateTo('auth-otp')
      toast.success('Registration successful! OTP sent.')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-16 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={34} className="h-9 w-auto object-contain" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>Join the NotJust wellness movement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="Your name" value={form.name} onChange={e => updateField('name', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input placeholder="Age" type="number" value={form.age} onChange={e => updateField('age', e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number *</Label>
              <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => updateField('email', e.target.value)} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Input value={form.country} onChange={e => updateField('country', e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input placeholder="State" value={form.state} onChange={e => updateField('state', e.target.value)} className="h-10" />
              </div>
            </div>
            <Button onClick={handleRegister} disabled={loading} className="w-full h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold">
              {loading ? 'Creating...' : 'Register'}
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              Already have an account?{' '}
              <button onClick={() => navigateTo('auth-login')} className="text-[#48805b] font-semibold hover:underline">
                Sign In
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

function AuthOTP() {
  const { navigateTo, setUser, pendingOtpContact, pendingOtpType } = useAppStore()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error('Please enter 6-digit OTP'); return }
    setLoading(true)
    try {
      const result = await authService.verifyOtp(pendingOtpContact || '', otp, pendingOtpType)
      if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Verification failed'); return }
      const userData = result.data as UserProfile
      setUser(userData)
      toast.success(`Welcome, ${userData.name}!`)
      navigateTo(userData.is_admin ? 'admin-dashboard' : 'landing')
    } catch { toast.error('Verification failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-16 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#48805b]" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold">Verify OTP</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to<br />
              <span className="font-medium text-[#1f1e1c]">{pendingOtpContact}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerify} disabled={loading || otp.length !== 6} className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base">
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <div className="text-center">
              <p className="text-sm text-[#88837b]">
                Demo OTP: <strong className="text-[#48805b]">123456</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================
// LEARNING MODULE
// ============================================================
const VIDEO_MODULES = [
  { id: 'intro', title: 'Introduction to NotJust', duration: '5:30', desc: 'Learn about our mission and the science behind glycemic control.' },
  { id: 'usage', title: 'How to Use NotJust', duration: '4:15', desc: 'Proper usage instructions for maximum effectiveness.' },
  { id: 'science', title: 'The Science of Glycemic Control', duration: '6:45', desc: 'Deep dive into the clinical research and evidence.' },
]

function LearningModule() {
  const { user, navigateTo, setSelectedProductId } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [productProgress, setProductProgress] = useState<Record<string, ProductLearningProgress>>({})
  const [loading, setLoading] = useState(true)

  // Legacy video player state (kept for backward compat)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [activeVideo, setActiveVideo] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const allComplete = VIDEO_MODULES.every(v => (progress[v.id] || 0) >= 100)

  useEffect(() => {
    if (!user) return
    Promise.all([
      productService.getAll(),
      productLearningService.getAllProgress(user.user_id),
      learningService.getProgress(user.user_id),
    ]).then(([productsR, progressR, legacyR]) => {
      if (productsR.data) setProducts(productsR.data)
      if (progressR.data) {
        const map: Record<string, ProductLearningProgress> = {}
        progressR.data.forEach(p => { map[p.product_id] = p })
        setProductProgress(map)
      }
      if (legacyR.data?.video_progress) setProgress(legacyR.data.video_progress)
      setLoading(false)
    })
  }, [user])

  const simulatePlay = (videoId: string) => {
    if (playing) {
      setPlaying(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    setPlaying(true)
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const current = prev[videoId] || 0
        if (current >= 100) {
          setPlaying(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
          return prev
        }
        const updated = { ...prev, [videoId]: Math.min(100, current + 2) }
        if (user) learningService.updateVideoProgress(user.user_id, updated)
        return updated
      })
    }, 100)
  }

  const getStatusBadge = (status: string | undefined) => {
    if (!status || status === 'NOT_STARTED') return { label: 'Not Started', bg: 'bg-[#e3dfd8]', text: 'text-[#88837b]', icon: Lock }
    if (status === 'IN_PROGRESS') return { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-800', icon: Play }
    if (status === 'PENDING_REEVALUATION') return { label: 'Re-evaluation', bg: 'bg-orange-100', text: 'text-orange-800', icon: RefreshCw }
    if (status === 'UNLOCKED' || status === 'COMPLETED') return { label: 'Unlocked', bg: 'bg-[#48805b]', text: 'text-white', icon: CheckCircle }
    return { label: status, bg: 'bg-[#e3dfd8]', text: 'text-[#88837b]', icon: Lock }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><RefreshCw className="w-8 h-8 animate-spin text-[#48805b]" /></div>

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1f1e1c]">Learning Dashboard</h1>
            <p className="text-[#88837b] mt-2">Complete per-product learning modules and quizzes to unlock purchase access.</p>
          </div>

          {/* Product Learning Cards */}
          <div className="mb-10">
            <h2 className="font-heading text-xl font-bold text-[#1f1e1c] mb-4">Product Learning</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {products.map((product, idx) => {
                const prog = productProgress[product.id]
                const badge = getStatusBadge(prog?.status)
                const BadgeIcon = badge.icon
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card className="card-lift border-[#e3dfd8] overflow-hidden group h-full flex flex-col">
                      <div className="relative aspect-[16/7] bg-gradient-to-br from-[#48805b]/10 to-[#afb75d]/10 flex items-center justify-center">
                        <Image src={product.image_url || (product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')} alt={product.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                        <Badge className={`absolute bottom-3 left-3 text-[10px] ${badge.bg} ${badge.text}`}>
                          <BadgeIcon className="w-3 h-3 mr-1" /> {badge.label}
                        </Badge>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <h3 className="font-heading font-bold text-[#1f1e1c] mb-1">{product.name}</h3>
                        <p className="text-sm text-[#88837b] line-clamp-2 mb-3 flex-1">{product.description}</p>
                        {prog?.video_progress && typeof prog.video_progress === 'object' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-[#88837b] mb-1">
                              <span>Video Progress</span>
                              <span>{Object.values(prog.video_progress as Record<string, number>).filter(v => v >= 100).length}/{Object.keys(prog.video_progress).length} complete</span>
                            </div>
                            <Progress value={
                              Object.keys(prog.video_progress).length > 0
                                ? Object.values(prog.video_progress as Record<string, number>).reduce((a: number, b: number) => a + b, 0) / Object.keys(prog.video_progress).length
                                : 0
                            } className="h-1.5" />
                          </div>
                        )}
                        <Button
                          className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl h-10"
                          onClick={() => {
                            setSelectedProductId(product.id)
                            navigateTo('product-learning')
                          }}
                        >
                          {(prog?.status === 'UNLOCKED' || prog?.status === 'COMPLETED') ? (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Review Content</>
                          ) : (
                            <><GraduationCap className="w-4 h-4 mr-2" /> Start Learning</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Legacy Learning Module */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs text-[#88837b] font-medium">General Learning</span>
              <Separator className="flex-1" />
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Video Player */}
              <div className="lg:col-span-2">
                <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
                  <div className="relative aspect-video flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#48805b]/30 to-[#1f1e1c]/60" />
                    <div className="relative text-center text-white z-10">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 transition-colors" onClick={() => simulatePlay(VIDEO_MODULES[activeVideo].id)}>
                        {playing ? <div className="w-6 h-6 flex gap-1"><div className="w-2 h-6 bg-white rounded-sm" /><div className="w-2 h-6 bg-white rounded-sm" /></div> : <Play className="w-8 h-8 ml-1" />}
                      </div>
                      <h3 className="font-heading font-bold text-xl">{VIDEO_MODULES[activeVideo].title}</h3>
                      <p className="text-white/60 text-sm mt-1">{VIDEO_MODULES[activeVideo].duration}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-white/60 text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(progress[VIDEO_MODULES[activeVideo]?.id] || 0)}%</span>
                    </div>
                    <Progress value={progress[VIDEO_MODULES[activeVideo]?.id] || 0} className="h-2" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-xl border border-[#e3dfd8]">
                  <h4 className="font-heading font-semibold text-[#1f1e1c] mb-1">{VIDEO_MODULES[activeVideo].title}</h4>
                  <p className="text-sm text-[#88837b]">{VIDEO_MODULES[activeVideo].desc}</p>
                </div>
              </div>

              {/* Video List */}
              <div className="space-y-3">
                <h3 className="font-heading font-semibold text-[#1f1e1c] mb-4">Modules</h3>
                {VIDEO_MODULES.map((video, i) => {
                  const p = progress[video.id] || 0
                  const isActive = i === activeVideo
                  return (
                    <button
                      key={video.id}
                      onClick={() => { setActiveVideo(i); setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current) }}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isActive ? 'bg-[#48805b]/10 border-[#48805b]/30' : 'bg-white border-[#e3dfd8] hover:border-[#48805b]/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          p >= 100 ? 'bg-[#48805b] text-white' : 'bg-[#e3dfd8] text-[#88837b]'
                        }`}>
                          {p >= 100 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#1f1e1c] truncate">{video.title}</p>
                          <p className="text-xs text-[#88837b]">{video.duration}</p>
                        </div>
                      </div>
                      <Progress value={p} className="h-1.5 mt-3" />
                    </button>
                  )
                })}

                {allComplete && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Button onClick={() => navigateTo('quiz')} className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold h-12 mt-4">
                      Take Quiz <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// QUIZ MODULE
// ============================================================
function QuizModule() {
  const { user, navigateTo, setUser } = useAppStore()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    quizService.getQuestions(5).then(r => {
      if (r.data && r.data.length > 0) setQuestions(r.data)
      else {
        toast.error('Failed to load quiz questions')
      }
      setLoading(false)
    })
  }, [])

  const score = Object.entries(answers).reduce((s, [qi, ai]) => {
    const q = questions[parseInt(qi)]
    return q && q.answer === ai ? s + 1 : s
  }, 0)
  const passed = score >= 3 // 60% of 5
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount >= questions.length

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error(`Please answer all questions. ${questions.length - answeredCount} remaining.`)
      return
    }
    setSubmitting(true)
    try {
      if (passed && user) {
        const result = await learningService.completeQuiz(user.user_id, (score / questions.length) * 100)
        if (result.error) {
          toast.error('Failed to save quiz results. Please try again.')
          setSubmitting(false)
          return
        }
        const updated = { ...user, learning_completed: true }
        setUser(updated)
        toast.success('Quiz completed! You can now browse products.')
      } else if (!passed) {
        toast.error(`You scored ${score}/${questions.length}. You need 60% to pass.`)
      }
      setShowResult(true)
    } catch (err) {
      console.error('Quiz submission error:', err)
      toast.error('Something went wrong. Please try again.')
    }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><RefreshCw className="w-8 h-8 animate-spin text-[#48805b]" /></div>

  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-16 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-[#48805b]/10' : 'bg-red-50'}`}>
            {passed ? <CheckCircle className="w-12 h-12 text-[#48805b]" /> : <AlertCircle className="w-12 h-12 text-red-500" />}
          </div>
          <h2 className="font-heading text-3xl font-bold text-[#1f1e1c] mb-2">
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </h2>
          <p className="text-[#88837b] mb-2">
            You scored {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          <p className="text-sm text-[#88837b] mb-8">
            {passed ? 'You\'ve unlocked purchase access!' : 'You need 60% to pass. Review the learning modules and try again.'}
          </p>
          <div className="flex gap-3 justify-center">
            {passed ? (
              <Button onClick={() => navigateTo('products')} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold">
                Browse Products <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => { setShowResult(false); setAnswers({}); setCurrent(0) }} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Quiz
              </Button>
            )}
            <Button variant="outline" onClick={() => navigateTo('learning')}>Back to Learning</Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const q = questions[current]
  if (!q) return null

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl font-bold text-[#1f1e1c]">Knowledge Quiz</h1>
            <Badge className="bg-[#48805b]/10 text-[#48805b]">{answeredCount}/{questions.length} answered</Badge>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} className="h-2 mb-4" />

          {/* Question navigation dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                  i === current
                    ? 'bg-[#48805b] text-white scale-110'
                    : answers[i] !== undefined
                      ? 'bg-[#48805b]/20 text-[#48805b] border border-[#48805b]/40'
                      : 'bg-white border border-[#e3dfd8] text-[#88837b] hover:border-[#48805b]/30'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Card className="border-[#e3dfd8]">
            <CardHeader>
              <CardTitle className="font-heading text-lg">{q.question}</CardTitle>
              {q.category && <CardDescription className="capitalize">{q.category} • {q.difficulty}</CardDescription>}
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[current] !== undefined ? answers[current].toString() : ""}
                onValueChange={v => setAnswers(prev => ({ ...prev, [current]: parseInt(v) }))}
                className="space-y-3"
              >
                {q.options.map((opt, i) => {
                  const isSelected = answers[current] === i
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#48805b]/5 border-[#48805b]/30 ring-1 ring-[#48805b]/20'
                          : 'border-[#e3dfd8] hover:border-[#48805b]/20 hover:bg-[#48805b]/[0.02]'
                      }`}
                    >
                      <RadioGroupItem value={i.toString()} id={`opt-${current}-${i}`} />
                      <Label htmlFor={`opt-${current}-${i}`} className="cursor-pointer flex-1">{opt}</Label>
                    </label>
                  )
                })}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent(c => c + 1)} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold"
                >
                  {submitting ? 'Submitting...' : allAnswered ? 'Submit Quiz' : `Submit (${answeredCount}/${questions.length})`}
                </Button>
              )}
            </CardFooter>
          </Card>

          {!allAnswered && current === questions.length - 1 && (
            <p className="text-center text-sm text-[#88837b] mt-4">
              Please answer all questions before submitting. Click on the question numbers above to review your answers.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// PRODUCTS & COMMERCE
// ============================================================
const PACK_TYPES = [
  { value: '30_DAY', label: '30-Day Pack', days: 30, discount: 0 },
  { value: '60_DAY', label: '60-Day Pack', days: 60, discount: 5 },
  { value: '90_DAY', label: '90-Day Pack', days: 90, discount: 10 },
  { value: '180_DAY', label: '180-Day Pack', days: 180, discount: 15 },
]

function ProductsCatalog() {
  const { user, navigateTo, addToCart, setSelectedProductId } = useAppStore()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [productProgress, setProductProgress] = useState<Record<string, ProductLearningProgress>>({})
  const [subSelectProduct, setSubSelectProduct] = useState<Product | null>(null)

  useEffect(() => {
    productService.getAll().then(r => {
      if (r.data) setProducts(r.data)
      setLoading(false)
    })
  }, [])

  // Handle URL search params - auto-navigate to product learning page
  useEffect(() => {
    if (!user || products.length === 0) return
    const productSlug = searchParams.get('product')
    if (!productSlug) return
    // Find matching product by slug (name converted to kebab-case)
    const matchedProduct = products.find(p => {
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      return slug === productSlug.toLowerCase()
    })
    if (matchedProduct) {
      setSelectedProductId(matchedProduct.id)
      navigateTo('product-learning')
    }
  }, [searchParams, user, products, navigateTo, setSelectedProductId])

  useEffect(() => {
    if (!user) return
    productLearningService.getAllProgress(user.user_id).then(r => {
      if (r.data) {
        const map: Record<string, ProductLearningProgress> = {}
        r.data.forEach(p => { map[p.product_id] = p })
        setProductProgress(map)
      }
    })
  }, [user])

  const isProductUnlocked = (productId: string) => {
    const p = productProgress[productId]
    return p?.status === 'UNLOCKED' || p?.status === 'COMPLETED'
  }

  const hasAnyLocked = products.some(p => !isProductUnlocked(p.id))

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-16"><RefreshCw className="w-8 h-8 animate-spin text-[#48805b]" /></div>

  const types = ['ALL', ...Array.from(new Set(products.map(p => p.type)))]
  const filtered = selectedType === 'ALL' ? products : products.filter(p => p.type === selectedType)

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#48805b]/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-[#48805b]" />
              </div>
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1f1e1c]">NOTJUST Watr Products</h1>
                <p className="text-[#88837b] mt-0.5">Choose Fizz or Still, then pick the purchase option that fits your routine.</p>
              </div>
            </div>
          </div>

          {user && hasAnyLocked && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-semibold text-amber-900">Complete Learning to Unlock Products</p>
                <p className="text-sm text-amber-700 mt-0.5">Complete per-product learning modules and quizzes to gain purchase access.</p>
              </div>
              <Button size="sm" onClick={() => navigateTo('learning')} className="bg-[#48805b] text-white flex-shrink-0 rounded-lg">
                Start Learning <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Type Filter */}
          <div className="mb-8 flex gap-2 flex-wrap">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedType === type ? 'bg-[#48805b] text-white shadow-md' : 'bg-white text-[#88837b] border border-[#e3dfd8] hover:border-[#48805b]/30'}`}
              >
                {type === 'ALL' ? 'All Products' : type}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-xl border border-[#e7b973]/40 bg-[#fff7ea] p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#e7b973]/20 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5 text-[#b56b20]" />
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
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
            {filtered.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="card-lift border-[#e3dfd8] overflow-hidden group h-full flex flex-col">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-[#e3dfd8]/50 to-[#f4f3f0] flex items-center justify-center overflow-hidden">
                    <Image src={product.image_url || (product.type === 'STILL' ? '/images/product-still.webp' : '/images/product-fizz.webp')} alt={product.name} fill className="object-contain p-6 group-hover:scale-105 transition-transform duration-500" />
                    <Badge className="absolute top-3 right-3 bg-[#48805b] text-white text-[10px] shadow-sm">{product.type}</Badge>
                    {product.stock < 50 && (
                      <Badge variant="destructive" className="absolute top-3 left-3 text-[10px]">Low Stock</Badge>
                    )}
                    {productProgress[product.id] && (
                      <Badge className={`absolute bottom-3 left-3 text-[10px] ${
                        isProductUnlocked(product.id) ? 'bg-[#48805b] text-white' :
                        productProgress[product.id].status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                        productProgress[product.id].status === 'PENDING_REEVALUATION' ? 'bg-orange-100 text-orange-800' :
                        'bg-[#e3dfd8] text-[#88837b]'
                      }`}>
                        {isProductUnlocked(product.id) ? 'Unlocked' :
                         productProgress[product.id].status === 'IN_PROGRESS' ? 'In Progress' :
                         productProgress[product.id].status === 'PENDING_REEVALUATION' ? 'Re-evaluation' :
                         'Locked'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h3 className="font-heading font-bold text-[#1f1e1c] mb-1">{product.name}</h3>
                    <p className="text-sm text-[#88837b] line-clamp-2 mb-4 flex-1">{product.description}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-heading text-2xl font-bold text-[#48805b]">₹{product.price.toLocaleString()}</p>
                        <p className="text-xs text-[#88837b] mt-0.5">{product.stock} in stock</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-5 pb-5 pt-0 flex-col gap-2">
                    {isProductUnlocked(product.id) ? (
                      <Button className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl h-11"
                        onClick={() => {
                          setSelectedProductId(product.id)
                          setSubSelectProduct(product)
                        }}>
                        <ShoppingCart className="w-4 h-4 mr-2" /> Buy Now
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full rounded-xl h-11"
                        onClick={() => {
                          setSelectedProductId(product.id)
                          navigateTo('product-learning')
                        }}>
                        <GraduationCap className="w-4 h-4 mr-2" /> Complete Learning
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-[#88837b] hover:text-[#48805b] rounded-lg h-8"
                      onClick={() => {
                        const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        const url = `${window.location.origin}${window.location.pathname}?product=${slug}`
                        navigator.clipboard.writeText(url).then(() => {
                          toast.success('Link copied to clipboard!')
                        }).catch(() => {
                          toast.error('Failed to copy link')
                        })
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy Link
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {subSelectProduct && (
            <SubscriptionSelector
              product={subSelectProduct}
              open={!!subSelectProduct}
              onClose={() => setSubSelectProduct(null)}
              onAddToCart={(mode, packType, amount, packDays, packDiscount) => {
                if (!subSelectProduct) return
                const isSub = mode === 'subscription'
                addToCart({
                  productId: isSub ? `${subSelectProduct.id}_sub_${packType}` : subSelectProduct.id,
                  name: subSelectProduct.name + (isSub ? ` (${PACK_TYPES.find(p => p.value === packType)?.label || packType})` : ''),
                  price: amount,
                  quantity: 1,
                  imageUrl: subSelectProduct.image_url || undefined,
                  type: subSelectProduct.type,
                  purchaseType: isSub ? 'subscription' : 'one-time',
                  packType: isSub ? packType : undefined,
                  packDays: isSub ? packDays : undefined,
                  packDiscount: isSub ? packDiscount : undefined,
                })
                toast.success(isSub ? 'Subscription plan added to cart!' : 'Added to cart!')
                setSubSelectProduct(null)
                navigateTo('cart')
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

function CartView() {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, navigateTo, clearCart } = useAppStore()
  const total = cartTotal()
  const tax = Math.round(total * 0.18)
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

  const subItems = cart.filter(i => i.purchaseType === 'subscription')
  const oneTimeItems = cart.filter(i => i.purchaseType === 'one-time')

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#88837b] mb-6">
            <button onClick={() => navigateTo('products')} className="hover:text-[#48805b] transition-colors">Products</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1f1e1c] font-medium">Cart ({cart.length})</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1f1e1c] mb-8">Your Cart</h1>

          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
              <div className="w-24 h-24 rounded-full bg-[#e3dfd8]/50 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-[#88837b]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-[#1f1e1c] mb-2">Your cart is empty</h3>
              <p className="text-[#88837b] mb-8">Looks like you haven&apos;t added anything yet.</p>
              <Button onClick={() => navigateTo('products')} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl px-8 h-12">
                Browse Products <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* One-Time Items */}
                {oneTimeItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-[#48805b]" />
                      <h2 className="font-heading font-semibold text-[#1f1e1c]">One-Time Purchase</h2>
                    </div>
                    {oneTimeItems.map((item, idx) => (
                      <motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} layout>
                        <Card className="border-[#e3dfd8] overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-0">
                            <div className="flex items-stretch">
                              <div className="w-28 sm:w-36 bg-gradient-to-br from-[#e3dfd8]/40 to-[#f4f3f0] flex items-center justify-center flex-shrink-0 p-4">
                                <div className="relative w-full h-full min-h-[80px]">
                                  <Image src={item.imageUrl || '/images/product-fizz.webp'} alt={item.name} fill className="object-contain" />
                                </div>
                              </div>
                              <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-heading font-bold text-[#1f1e1c] truncate">{item.name}</h3>
                                  <p className="text-sm text-[#88837b] mt-0.5">{item.type} · One-Time</p>
                                  <p className="font-heading text-lg font-bold text-[#48805b] mt-1 sm:hidden">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} className="w-9 h-9 rounded-lg border border-[#e3dfd8] flex items-center justify-center hover:bg-[#e3dfd8]/50 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                                  <span className="w-10 text-center font-heading font-semibold text-[#1f1e1c]">{item.quantity}</span>
                                  <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} className="w-9 h-9 rounded-lg border border-[#e3dfd8] flex items-center justify-center hover:bg-[#e3dfd8]/50 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="hidden sm:flex flex-col items-end gap-2">
                                  <p className="font-heading text-lg font-bold text-[#48805b]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                  <button onClick={() => { removeFromCart(item.productId); toast.info(`${item.name} removed`) }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Subscription Items */}
                {subItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-[#afb75d]" />
                      <h2 className="font-heading font-semibold text-[#1f1e1c]">Subscription Plans</h2>
                    </div>
                    {subItems.map((item, idx) => (
                      <motion.div key={item.productId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} layout>
                        <Card className="border-[#afb75d]/30 overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-r from-[#f4f5e8]/50 to-transparent">
                          <CardContent className="p-0">
                            <div className="flex items-stretch">
                              <div className="w-28 sm:w-36 bg-gradient-to-br from-[#f4f5e8]/60 to-[#f4f3f0] flex items-center justify-center flex-shrink-0 p-4">
                                <div className="relative w-full h-full min-h-[80px]">
                                  <Image src={item.imageUrl || '/images/product-fizz.webp'} alt={item.name} fill className="object-contain" />
                                </div>
                              </div>
                              <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-heading font-bold text-[#1f1e1c] truncate">{item.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-[#afb75d]/15 text-[#7a8030] text-[10px] border border-[#afb75d]/20">Subscription</Badge>
                                    {item.packDays && <span className="text-xs text-[#88837b]">{item.packDays}-day pack</span>}
                                    {item.packDiscount && item.packDiscount > 0 && <span className="text-xs text-[#48805b] font-medium">{item.packDiscount}% off</span>}
                                  </div>
                                  <p className="text-xs text-[#88837b] mt-1">Auto-renews · Cancel anytime</p>
                                  <p className="font-heading text-lg font-bold text-[#48805b] mt-1 sm:hidden">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                                <div className="hidden sm:flex flex-col items-end gap-2">
                                  <p className="font-heading text-lg font-bold text-[#48805b]">₹{(item.price * item.quantity).toLocaleString()}</p>
                                  <button onClick={() => { removeFromCart(item.productId); toast.info(`${item.name} removed`) }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Clear Cart */}
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { clearCart(); toast.info('Cart cleared') }} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="border-[#e3dfd8] shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="font-heading text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.map(item => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-[#88837b] truncate mr-2">
                            {item.name}
                            {item.purchaseType === 'subscription' && <span className="text-[#afb75d] ml-1">🔄</span>}
                            <span className="text-[#88837b]/60"> × {item.quantity}</span>
                          </span>
                          <span className="font-medium text-[#1f1e1c] flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}

                      <Separator />

                      {/* Coupon Code */}
                      <div>
                        <Label className="text-xs text-[#88837b] mb-1.5 block">Coupon Code</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter code"
                            value={coupon}
                            onChange={e => setCoupon(e.target.value)}
                            className="h-9 text-sm rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-lg flex-shrink-0"
                            onClick={() => { if (coupon) { setCouponApplied(true); toast.success('Coupon applied! (demo)') } }}
                          >
                            Apply
                          </Button>
                        </div>
                        {couponApplied && (
                          <p className="text-xs text-[#48805b] mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Discount applied
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#88837b]">Subtotal</span>
                          <span className="font-medium">₹{total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#88837b]">Shipping</span>
                          <span className="text-[#48805b] font-medium">Free</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#88837b]">Tax (18% GST)</span>
                          <span className="font-medium">₹{tax.toLocaleString()}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="font-heading font-bold text-lg text-[#1f1e1c]">Total</span>
                        <span className="font-heading font-bold text-2xl text-[#48805b]">₹{(total + tax).toLocaleString()}</span>
                      </div>

                      {subItems.length > 0 && (
                        <p className="text-[10px] text-[#88837b] bg-[#f4f5e8]/50 rounded-lg p-2">
                          🔄 Subscription items will auto-renew. You can cancel anytime after payment.
                        </p>
                      )}

                      <Button
                        onClick={() => navigateTo('checkout')}
                        className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl mt-2"
                      >
                        Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <Button variant="ghost" className="w-full text-[#88837b]" onClick={() => navigateTo('products')}>
                        Continue Shopping
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function CheckoutView() {
  const { user, cart, cartTotal, navigateTo, clearCart, setLastOrderId } = useAppStore()
  const [step, setStep] = useState(1) // 1=Address, 2=Payment, 3=Confirm
  const [address, setAddress] = useState({ name: user?.name || '', line1: '', city: '', state: '', pincode: '' })
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [loading, setLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const total = cartTotal()
  const tax = Math.round(total * 0.18)
  const grandTotal = total + tax

  const handlePlaceOrder = async (payId?: string) => {
    setLoading(true)
    try {
      // Separate one-time and subscription items
      const oneTimeItems = cart.filter(i => i.purchaseType === 'one-time')
      const subItems = cart.filter(i => i.purchaseType === 'subscription')

      // Create order for one-time items (if any)
      if (oneTimeItems.length > 0) {
        const result = await orderService.create(
          user!.user_id,
          oneTimeItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          address,
          paymentMethod === 'razorpay' ? 'RAZORPAY' : 'COD'
        )
        if (result.error) { toast.error(typeof result.error === 'string' ? result.error : 'Order failed'); return }
        setLastOrderId((result.data as any)?.id || null)
      }

      // Create subscriptions ONLY after payment succeeds (if any sub items)
      for (const item of subItems) {
        // Extract real product ID from composite ID (format: {productId}_sub_{packType})
        const realProductId = item.productId.split('_sub_')[0]
        const now = new Date()
        const endDate = new Date(now.getTime() + (item.packDays || 30) * 24 * 60 * 60 * 1000)
        await subscriptionService.create({
          user_id: user!.user_id,
          product_id: realProductId,
          pack_type: item.packType || '30_DAY',
          pack_duration_days: item.packDays || 30,
          status: 'ACTIVE',
          amount: item.price,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
        } as any)

        // Also create an order record for the subscription
        const subOrderResult = await orderService.create(
          user!.user_id,
          [{ productId: realProductId, quantity: 1 }],
          address,
          paymentMethod === 'razorpay' ? 'RAZORPAY' : 'COD'
        )
        if (!lastOrderId && subOrderResult.data) {
          setLastOrderId((subOrderResult.data as any)?.id || null)
        }
      }

      setPaymentId(payId || null)
      clearCart()
      navigateTo('order-success')
      toast.success(subItems.length > 0 ? 'Order placed & subscriptions activated!' : 'Order placed successfully!')
    } catch { toast.error('Order failed') }
    finally { setLoading(false) }
  }

  const handleRazorpayPayment = async () => {
    // Try to use real Razorpay checkout if available
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const options = {
        key: 'rzp_test_DEMO_KEY', // Demo key — replace with real key in production
        amount: grandTotal * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'NotJust Health',
        description: cart.some(i => i.purchaseType === 'subscription') ? 'Pre-Meal Wellness Shot + Subscription' : 'Pre-Meal Wellness Shot',
        image: '/images/notjust-logo-clean.png',
        handler: function(response: any) {
          handlePlaceOrder(response.razorpay_payment_id)
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#48805b' },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled')
          }
        }
      }
      try {
        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function() {
          toast.error('Payment failed. Please try again.')
        })
        rzp.open()
      } catch {
        // Fallback to demo mode
        const demoPaymentId = 'pay_demo_' + Date.now()
        handlePlaceOrder(demoPaymentId)
      }
    } else {
      // Razorpay script not loaded — demo mode
      toast.info('Razorpay demo mode — payment simulated')
      const demoPaymentId = 'pay_demo_' + Date.now()
      handlePlaceOrder(demoPaymentId)
    }
  }

  const steps = [
    { num: 1, label: 'Address', icon: MapPin },
    { num: 2, label: 'Payment', icon: CreditCard },
    { num: 3, label: 'Confirmation', icon: CheckCircle },
  ]

  const addressValid = address.name && address.line1 && address.city && address.state && address.pincode

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#88837b] mb-6">
            <button onClick={() => navigateTo('cart')} className="hover:text-[#48805b] transition-colors">Cart</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1f1e1c] font-medium">Checkout</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#1f1e1c] mb-8">Checkout</h1>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-10">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step >= s.num ? 'bg-[#48805b] text-white' : 'bg-[#e3dfd8] text-[#88837b]'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={`font-medium text-sm hidden sm:block ${step >= s.num ? 'text-[#1f1e1c]' : 'text-[#88837b]'}`}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-3 rounded-full transition-all ${step > s.num ? 'bg-[#48805b]' : 'bg-[#e3dfd8]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
              {/* Step 1: Address */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-[#e3dfd8]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#48805b]/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[#48805b]" />
                        </div>
                        <div>
                          <CardTitle className="font-heading">Shipping Address</CardTitle>
                          <p className="text-xs text-[#88837b] mt-0.5">Where should we deliver your order?</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Full Name</Label>
                        <Input value={address.name} onChange={e => setAddress(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className="rounded-lg" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Address Line 1</Label>
                        <Input value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Street address, house no." className="rounded-lg" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label>City</Label>
                          <Input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} className="rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>State</Label>
                          <Input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} className="rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>PIN Code</Label>
                          <Input value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} className="rounded-lg" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end px-6 pb-6">
                      <Button
                        onClick={() => { if (!addressValid) { toast.error('Please fill all address fields'); return }; setStep(2) }}
                        className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl px-8 h-11"
                      >
                        Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-[#e3dfd8]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#48805b]/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-[#48805b]" />
                        </div>
                        <div>
                          <CardTitle className="font-heading">Payment Method</CardTitle>
                          <p className="text-xs text-[#88837b] mt-0.5">Choose how you want to pay</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Razorpay Option */}
                      <button
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === 'razorpay' ? 'border-[#48805b] bg-[#48805b]/5' : 'border-[#e3dfd8] hover:border-[#48805b]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'razorpay' ? 'border-[#48805b]' : 'border-[#e3dfd8]'
                          }`}>
                            {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#48805b]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-semibold text-[#1f1e1c]">Online Payment</span>
                              <Badge className="bg-[#2e91b2]/10 text-[#2e91b2] text-[10px]">Razorpay</Badge>
                            </div>
                            <p className="text-xs text-[#88837b] mt-0.5">Pay securely with UPI, Cards, Net Banking & Wallets</p>
                          </div>
                          <div className="flex items-center gap-1 text-[#88837b]">
                            <Shield className="w-4 h-4" />
                            <span className="text-[10px]">Secure</span>
                          </div>
                        </div>
                      </button>

                      {/* COD Option */}
                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          paymentMethod === 'cod' ? 'border-[#48805b] bg-[#48805b]/5' : 'border-[#e3dfd8] hover:border-[#48805b]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'cod' ? 'border-[#48805b]' : 'border-[#e3dfd8]'
                          }`}>
                            {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#48805b]" />}
                          </div>
                          <div className="flex-1">
                            <span className="font-heading font-semibold text-[#1f1e1c]">Cash on Delivery</span>
                            <p className="text-xs text-[#88837b] mt-0.5">Pay when your order arrives at your doorstep</p>
                          </div>
                          <Truck className="w-5 h-5 text-[#88837b]" />
                        </div>
                      </button>
                    </CardContent>
                    <CardFooter className="flex justify-between px-6 pb-6">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (paymentMethod === 'cod') {
                            handlePlaceOrder()
                          } else {
                            handleRazorpayPayment()
                          }
                        }}
                        disabled={loading}
                        className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl px-8 h-11"
                      >
                        {loading ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                        ) : paymentMethod === 'razorpay' ? (
                          <><CreditCard className="w-4 h-4 mr-2" /> Pay ₹{grandTotal.toLocaleString()}</>
                        ) : (
                          <><Truck className="w-4 h-4 mr-2" /> Place Order (COD)</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="md:col-span-2">
              <Card className="border-[#e3dfd8] sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-base">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.map(item => (
                    <div key={item.productId} className="flex gap-3 items-start">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${item.purchaseType === 'subscription' ? 'bg-[#f4f5e8]/80' : 'bg-[#e3dfd8]/50'}`}>
                        {item.purchaseType === 'subscription' ? <RefreshCw className="w-5 h-5 text-[#afb75d]" /> : <Package className="w-5 h-5 text-[#88837b]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1f1e1c] truncate">{item.name}</p>
                        <p className="text-xs text-[#88837b]">
                          {item.purchaseType === 'subscription' ? `Subscription · ${item.packDays || 30}-day` : `Qty: ${item.quantity}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#1f1e1c]">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#88837b]">Subtotal</span><span>₹{total.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[#88837b]">Shipping</span><span className="text-[#48805b]">Free</span></div>
                    <div className="flex justify-between"><span className="text-[#88837b]">Tax (18% GST)</span><span>₹{tax.toLocaleString()}</span></div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-heading font-bold">
                    <span className="text-lg">Total</span>
                    <span className="text-lg text-[#48805b]">₹{grandTotal.toLocaleString()}</span>
                  </div>

                  {cart.some(i => i.purchaseType === 'subscription') && (
                    <p className="text-[10px] text-[#88837b] bg-[#f4f5e8]/50 rounded-lg p-2">
                      🔄 Subscription items will be activated after payment. Auto-renews until cancelled.
                    </p>
                  )}

                  {/* Address Preview */}
                  {step >= 2 && addressValid && (
                    <>
                      <Separator />
                      <div className="text-xs">
                        <p className="text-[#88837b] mb-1">Delivering to:</p>
                        <p className="text-[#1f1e1c] font-medium">{address.name}</p>
                        <p className="text-[#88837b]">{address.line1}, {address.city}, {address.state} - {address.pincode}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function OrderSuccess() {
  const { lastOrderId, navigateTo } = useAppStore()
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-16 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-[#e3dfd8] shadow-xl text-center overflow-hidden">
          {/* Green header accent */}
          <div className="h-2 bg-gradient-to-r from-[#48805b] to-[#afb75d]" />
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-[#48805b]" />
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-[#1f1e1c] mb-2">Order Placed!</h2>
            <p className="text-[#88837b] mb-6">Thank you for your purchase. Your wellness journey begins now.</p>
            {lastOrderId && (
              <div className="p-3 rounded-xl bg-[#f4f3f0] border border-[#e3dfd8] mb-6">
                <p className="text-xs text-[#88837b] mb-1">Order ID</p>
                <p className="font-mono text-[#48805b] font-semibold">{lastOrderId}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigateTo('products')} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold rounded-xl h-11">
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => navigateTo('landing')} className="rounded-xl h-11">Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================
// ADMIN DASHBOARD — Jira/Huly Executive Style
// ============================================================
// CSV Export helper
function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  const header = columns.map(c => c.label).join(',')
  const rows = data.map(row => columns.map(c => {
    const val = row[c.key]
    const str = val === null || val === undefined ? '' : String(val)
    return `"${str.replace(/"/g, '""')}"`
  }).join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${filename}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success(`Exported ${data.length} rows as CSV`)
}

// PDF Export helper (simple HTML-to-print)
function exportToPDF(title: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:system-ui;margin:40px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:13px;}th{background:#f5f5f5;font-weight:600;}</style>
    </head><body><h1>${title}</h1><p>Generated: ${new Date().toLocaleString()}</p>`)
  const mainContent = document.querySelector('[data-admin-content]')
  if (mainContent) {
    const table = mainContent.querySelector('table')
    if (table) printWindow.document.write(table.outerHTML)
    else printWindow.document.write(mainContent.innerHTML)
  }
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.print()
}


// ============================================================
// ADMIN DASHBOARD — Jira/Huly Style Light Theme
// ============================================================

// Admin theme constants
const A = {
  bg: '#f4f3f0',
  surface: '#ffffff',
  border: '#e3dfd8',
  borderLight: '#eeebe5',
  text: '#1f1e1c',
  textSecondary: '#6b6560',
  textMuted: '#99948d',
  green: '#48805b',
  greenLight: '#e8f0eb',
  lime: '#afb75d',
  limeLight: '#f4f5e8',
  blue: '#2e91b2',
  blueLight: '#e6f2f7',
  amber: '#c4880e',
  amberLight: '#fdf5e6',
  red: '#c44530',
  redLight: '#fceeed',
  sidebarBg: '#1f1e1c',
  sidebarText: '#c8c3bb',
  sidebarActive: '#48805b',
  sidebarHover: '#2a2926',
}

function AdminDashboard() {
  const { adminTab, setAdminTab, user, navigateTo } = useAppStore()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [scans, setScans] = useState<QrScan[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [orderView, setOrderView] = useState<'kanban' | 'table'>('table')
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [adminSubscriptions, setAdminSubscriptions] = useState<Subscription[]>([])
  const [productVideoCounts, setProductVideoCounts] = useState<Record<string, number>>({})
  const [productQuizCounts, setProductQuizCounts] = useState<Record<string, number>>({})
  const [productLearningStats, setProductLearningStats] = useState<Record<string, { total: number; completed: number; unlocked: number }>>({})
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [galleryUploading, setGalleryUploading] = useState(false)
  // Manage Learning Content dialog
  const [showManageLearning, setShowManageLearning] = useState(false)
  const [learningProductId, setLearningProductId] = useState<string | null>(null)
  const [learningVideos, setLearningVideos] = useState<ProductVideo[]>([])
  const [learningQuizzes, setLearningQuizzes] = useState<ProductQuiz[]>([])
  const [learningLoading, setLearningLoading] = useState(false)
  const [editingVideo, setEditingVideo] = useState<ProductVideo | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<ProductQuiz | null>(null)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [showAddQuiz, setShowAddQuiz] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', duration: '', description: '', order: 1, video_url: '' })
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: '' })
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', short_description: '', price: 0, mrp: 0, stock: 0,
    image_url: '', gallery_images: '', type: 'FIZZ', category: 'Wellness Shot',
    sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
    active: true, featured: false,
    brand: '', flavor: '', serving_size: '', allergen_info: '', storage_info: '',
    shelf_life: '', country_origin: '', fssai_license: '', hsn_code: '',
    gst_rate: 0, min_order_qty: 1, max_order_qty: 10, discount_label: '', highlights: '',
  })

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) return data.url
      toast.error(data.error || 'Upload failed')
      return null
    } catch {
      toast.error('Upload failed')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const resetProductForm = () => {
    setNewProduct({
      name: '', description: '', short_description: '', price: 0, mrp: 0, stock: 0,
      image_url: '', gallery_images: '', type: 'FIZZ', category: 'Wellness Shot',
      sku: '', weight: '', ingredients: '', nutrition_info: '', tags: '',
      active: true, featured: false,
      brand: '', flavor: '', serving_size: '', allergen_info: '', storage_info: '',
      shelf_life: '', country_origin: '', fssai_license: '', hsn_code: '',
      gst_rate: 0, min_order_qty: 1, max_order_qty: 10, discount_label: '', highlights: '',
    })
    setEditingProduct(null)
  }

  // Load learning content for a product
  const loadLearningContent = async (productId: string) => {
    setLearningProductId(productId)
    setShowManageLearning(true)
    setLearningLoading(true)
    try {
      const [vR, qR] = await Promise.all([
        productVideoService.getByProduct(productId),
        productQuizService.getByProduct(productId),
      ])
      setLearningVideos(vR.data || [])
      setLearningQuizzes(qR.data || [])
    } catch (err) {
      console.error('Failed to load learning content:', err)
    } finally {
      setLearningLoading(false)
    }
  }

  // Save video (create or update)
  const handleSaveVideo = async () => {
    if (!learningProductId || !newVideo.title) { toast.error('Title is required'); return }
    if (editingVideo) {
      const r = await productVideoService.update(editingVideo.id, newVideo as any)
      if (r.data) { toast.success('Video updated!'); setEditingVideo(null); setShowAddVideo(false); loadLearningContent(learningProductId) }
      else toast.error('Failed to update video')
    } else {
      const r = await productVideoService.create({ ...newVideo, product_id: learningProductId } as any)
      if (r.data) { toast.success('Video added!'); setShowAddVideo(false); setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '' }); loadLearningContent(learningProductId) }
      else toast.error('Failed to add video')
    }
  }

  // Save quiz (create or update)
  const handleSaveQuiz = async () => {
    if (!learningProductId || !newQuiz.question || !newQuiz.video_id) { toast.error('Question and video are required'); return }
    if (editingQuiz) {
      const r = await productQuizService.update(editingQuiz.id, { ...newQuiz, options: newQuiz.options } as any)
      if (r.data) { toast.success('Question updated!'); setEditingQuiz(null); setShowAddQuiz(false); loadLearningContent(learningProductId) }
      else toast.error('Failed to update question')
    } else {
      const r = await productQuizService.create({ ...newQuiz, product_id: learningProductId, options: newQuiz.options } as any)
      if (r.data) { toast.success('Question added!'); setShowAddQuiz(false); setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: '' }); loadLearningContent(learningProductId) }
      else toast.error('Failed to add question')
    }
  }

  // Delete video (soft delete)
  const handleDeleteVideo = async (videoId: string) => {
    if (!learningProductId) return
    if (!confirm('Delete this video? This will also hide its quiz questions.')) return
    const r = await productVideoService.delete(videoId)
    if (r.data !== undefined) { toast.success('Video deleted'); loadLearningContent(learningProductId) }
    else toast.error('Failed to delete video')
  }

  // Delete quiz (soft delete)
  const handleDeleteQuiz = async (quizId: string) => {
    if (!learningProductId) return
    if (!confirm('Delete this quiz question?')) return
    const r = await productQuizService.delete(quizId)
    if (r.data !== undefined) { toast.success('Question deleted'); loadLearningContent(learningProductId) }
    else toast.error('Failed to delete question')
  }

  // Reorder video (move up/down)
  const handleReorderVideo = async (videoId: string, direction: 'up' | 'down') => {
    if (!learningProductId) return
    const videos = [...learningVideos]
    const idx = videos.findIndex(v => v.id === videoId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= videos.length) return
    // Swap orders
    const currentOrder = videos[idx].order
    const swapOrder = videos[swapIdx].order
    await Promise.all([
      productVideoService.update(videoId, { order: swapOrder }),
      productVideoService.update(videos[swapIdx].id, { order: currentOrder }),
    ])
    loadLearningContent(learningProductId)
  }

  // Reorder quiz question (move up/down)
  const handleReorderQuiz = async (quizId: string, direction: 'up' | 'down') => {
    if (!learningProductId) return
    const quizzes = [...learningQuizzes]
    const idx = quizzes.findIndex(q => q.id === quizId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= quizzes.length) return
    const currentOrder = quizzes[idx].order
    const swapOrder = quizzes[swapIdx].order
    await Promise.all([
      productQuizService.update(quizId, { order: swapOrder }),
      productQuizService.update(quizzes[swapIdx].id, { order: currentOrder }),
    ])
    loadLearningContent(learningProductId)
  }

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) { toast.error('Name and price are required'); return }
    if (editingProduct) {
      const r = await productService.update(editingProduct.id, newProduct as any)
      if (r.data) { toast.success('Product updated!'); setShowAddProduct(false); resetProductForm(); refreshData() }
      else toast.error('Failed to update product')
    } else {
      const r = await productService.create(newProduct as any)
      if (r.data) { toast.success('Product created!'); setShowAddProduct(false); resetProductForm(); refreshData() }
      else toast.error('Failed to create product')
    }
  }

  useEffect(() => {
    if (!user?.is_admin) { navigateTo('landing'); return }
    const load = async () => {
      const [statsR, usersR, campsR, scansR, ordersR, questionsR, productsR, subsR] = await Promise.all([
        adminStatsService.getDashboardStats(),
        userService.getAll(),
        campaignService.getAll(),
        qrScanService.getAll(),
        orderService.getAll(),
        quizService.getQuestions(20),
        productService.getAllForAdmin(),
        subscriptionService.getAll(),
      ])
      if (statsR.data) setStats(statsR.data)
      if (usersR.data) setUsers(usersR.data)
      if (campsR.data) setCampaigns(campsR.data)
      if (scansR.data) setScans(scansR.data)
      if (ordersR.data) setOrders(ordersR.data)
      if (questionsR.data) setQuestions(questionsR.data)
      if (productsR.data) setAdminProducts(productsR.data)
      if (subsR.data) setAdminSubscriptions(subsR.data as Subscription[])

      // Fetch video/quiz counts per product
      if (productsR.data) {
        const vCounts: Record<string, number> = {}
        const qCounts: Record<string, number> = {}
        const lStats: Record<string, { total: number; completed: number; unlocked: number }> = {}
        for (const prod of productsR.data as Product[]) {
          const [vR, qR] = await Promise.all([
            productVideoService.getByProduct(prod.id),
            productQuizService.getByProduct(prod.id),
          ])
          vCounts[prod.id] = (vR.data || []).length
          qCounts[prod.id] = (qR.data || []).length
        }
        // Compute learning stats across all users
        if (usersR.data) {
          for (const prod of productsR.data as Product[]) {
            let total = 0, completed = 0, unlocked = 0
            for (const u of usersR.data as any[]) {
              const pR = await productLearningService.getProgress(u.user_id, prod.id)
              if (pR.data) {
                total++
                if (pR.data.status === 'COMPLETED') completed++
                if (pR.data.status === 'UNLOCKED' || pR.data.status === 'COMPLETED') unlocked++
              }
            }
            lStats[prod.id] = { total, completed, unlocked }
          }
        }
        setProductVideoCounts(vCounts)
        setProductQuizCounts(qCounts)
        setProductLearningStats(lStats)
      }

      setLoading(false)
    }
    load()
  }, [user, navigateTo])

  const refreshData = async () => {
    setLoading(true)
    const [statsR, usersR, campsR, scansR, ordersR, productsR, subsR] = await Promise.all([
      adminStatsService.getDashboardStats(),
      userService.getAll(),
      campaignService.getAll(),
      qrScanService.getAll(),
      orderService.getAll(),
      productService.getAllForAdmin(),
      subscriptionService.getAll(),
    ])
    if (statsR.data) setStats(statsR.data)
    if (usersR.data) setUsers(usersR.data)
    if (campsR.data) setCampaigns(campsR.data)
    if (scansR.data) setScans(scansR.data)
    if (ordersR.data) setOrders(ordersR.data)
    if (productsR.data) setAdminProducts(productsR.data)
    if (subsR.data) setAdminSubscriptions(subsR.data as Subscription[])
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-admin)]" style={{ background: A.bg }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center animate-pulse" style={{ background: A.greenLight }}>
          <Leaf className="w-5 h-5" style={{ color: A.green }} />
        </div>
        <span className="text-sm" style={{ color: A.textMuted }}>Loading dashboard...</span>
      </div>
    </div>
  )
  if (!stats) return null

  const ordersByStatus = Object.entries(stats.ordersByStatus || {}).map(([name, value]) => ({ name, value: value as number }))
  const scansByCampaign = Object.entries(stats.scansByCampaign || {}).map(([name, value]) => ({ name: name.slice(0, 15), value: value as number }))
  const campaignsByChannel = Object.entries(stats.campaignsByChannel || {}).map(([name, value]) => ({ name, value: value as number }))

  const revenueTrend = [
    { month: 'Jan', revenue: Math.round(stats.totalRevenue * 0.1), orders: Math.round(stats.totalOrders * 0.08) },
    { month: 'Feb', revenue: Math.round(stats.totalRevenue * 0.12), orders: Math.round(stats.totalOrders * 0.1) },
    { month: 'Mar', revenue: Math.round(stats.totalRevenue * 0.18), orders: Math.round(stats.totalOrders * 0.15) },
    { month: 'Apr', revenue: Math.round(stats.totalRevenue * 0.22), orders: Math.round(stats.totalOrders * 0.18) },
    { month: 'May', revenue: Math.round(stats.totalRevenue * 0.28), orders: Math.round(stats.totalOrders * 0.22) },
    { month: 'Jun', revenue: Math.round(stats.totalRevenue * 0.32), orders: Math.round(stats.totalOrders * 0.27) },
  ]

  const sidebarItems = [
    { value: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { value: 'users', label: 'Users', icon: Users, badge: users.length },
    { value: 'campaigns', label: 'Campaigns', icon: MegaphoneIcon, badge: campaigns.length },
    { value: 'products', label: 'Products', icon: Store, badge: null },
    { value: 'qr', label: 'QR Codes', icon: QrCode, badge: campaigns.filter(c => c.status === 'ACTIVE').length },
    { value: 'orders', label: 'Orders', icon: Package, badge: orders.length },
    { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: null },
    { value: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
    { value: 'content', label: 'Content', icon: FileText, badge: questions.length },
  ]

  const filteredUsers = userSearch
    ? users.filter((u: any) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
    : users

  const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const
  const ordersByKanbanStatus = (status: string) => orders.filter((o: any) => o.status === status)

  const statusColors: Record<string, { text: string; bg: string; dot: string }> = {
    PENDING: { text: A.amber, bg: A.amberLight, dot: A.amber },
    CONFIRMED: { text: A.blue, bg: A.blueLight, dot: A.blue },
    SHIPPED: { text: '#7c3aed', bg: '#f3f0ff', dot: '#7c3aed' },
    DELIVERED: { text: A.green, bg: A.greenLight, dot: A.green },
    CANCELLED: { text: A.red, bg: A.redLight, dot: A.red },
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const c = statusColors[status] || { text: A.textMuted, bg: A.borderLight, dot: A.textMuted }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ color: c.text, background: c.bg }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
        {status}
      </span>
    )
  }

  const renderContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return (
          <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: A.green, bgColor: A.greenLight, trend: '+12%', sub: `${stats.learningCompleted} completed learning` },
                { label: 'QR Scans', value: stats.totalScans, icon: QrCode, color: A.blue, bgColor: A.blueLight, trend: '+8%', sub: `${campaigns.filter(c => c.status === 'ACTIVE').length} active campaigns` },
                { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: A.lime, bgColor: A.limeLight, trend: '+23%', sub: `${orders.filter((o: any) => o.status === 'DELIVERED').length} delivered` },
                { label: 'Revenue', value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: DollarSign, color: A.green, bgColor: A.greenLight, trend: '+15%', sub: `₹${stats.totalRevenue ? Math.round(stats.totalRevenue * 0.3).toLocaleString() : 0} this month` },
              ].map(card => (
                <div key={card.label} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: card.bgColor }}>
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                    </div>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.green, background: A.greenLight }}>{card.trend}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: A.text }}>{card.value}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: A.textSecondary }}>{card.label}</p>
                  <p className="text-[11px] mt-1" style={{ color: A.textMuted }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: A.text }}>Revenue Trend</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: A.greenLight, color: A.green }}>6 months</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 11, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={A.green} strokeWidth={2} dot={{ r: 3, fill: A.green }} />
                    <Line type="monotone" dataKey="orders" stroke={A.lime} strokeWidth={2} dot={{ r: 3, fill: A.lime }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: A.text }}>Orders by Status</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: A.blueLight, color: A.blue }}>{orders.length} total</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0}>
                      {ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Legend formatter={(value: string) => <span style={{ color: A.textSecondary, fontSize: 12 }}>{value}</span>} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity + Quick Stats */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Recent Activity</h3>
                <div className="space-y-1">
                  {(stats.recentUsers || []).slice(0, 4).map((u: UserProfile) => (
                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8f7f5] transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
                        <span className="text-[11px] font-bold" style={{ color: A.green }}>{u.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: A.text }}>{u.name} <span style={{ color: A.textMuted }}>registered</span></p>
                        <p className="text-[11px]" style={{ color: A.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={u.learning_completed ? 'DELIVERED' : 'PENDING'} />
                    </div>
                  ))}
                  {orders.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f8f7f5] transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.blueLight }}>
                        <Package className="w-3.5 h-3.5" style={{ color: A.blue }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: A.text }}>Order ₹{o.amount?.toLocaleString()} <span style={{ color: A.textMuted }}>by {o.user?.name || 'Customer'}</span></p>
                        <p className="text-[11px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Conversion Rate</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.green }}>{stats.conversionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.conversionRate}%`, background: A.green }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Learning Completion</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.blue }}>{stats.totalUsers ? Math.round(stats.learningCompleted / stats.totalUsers * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.totalUsers ? Math.round(stats.learningCompleted / stats.totalUsers * 100) : 0}%`, background: A.blue }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px]" style={{ color: A.textSecondary }}>Order Fulfillment</span>
                      <span className="text-[12px] font-semibold" style={{ color: A.lime }}>{stats.totalOrders ? Math.round((orders.filter((o: any) => o.status === 'DELIVERED').length / stats.totalOrders) * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${stats.totalOrders ? Math.round((orders.filter((o: any) => o.status === 'DELIVERED').length / stats.totalOrders) * 100) : 0}%`, background: A.lime }} />
                    </div>
                  </div>
                  <Separator style={{ background: A.border }} />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 text-center" style={{ background: A.bg }}>
                      <p className="font-bold text-lg" style={{ color: A.text }}>{stats.learningCompleted}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Completed</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: A.bg }}>
                      <p className="font-bold text-lg" style={{ color: A.text }}>{stats.totalUsers - stats.learningCompleted}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Users</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{users.length} registered users</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: A.textMuted }} />
                <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 w-64 h-8 text-sm" style={{ background: '#fff', borderColor: A.border, color: A.text }} />
              </div>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: A.borderLight }} className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>User</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Contact</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Learning</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Joined</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: A.textMuted }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: any) => (
                    <TableRow key={u.id} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
                            <span className="text-[11px] font-bold" style={{ color: A.green }}>{u.name?.charAt(0) || '?'}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: A.text }}>{u.name}</p>
                            {u.is_admin && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.green, background: A.greenLight }}>Admin</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]" style={{ color: A.textSecondary }}>{u.email || u.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: A.borderLight }}>
                            <div className="h-full rounded-full" style={{ width: u.learning_completed ? '100%' : '0%', background: u.learning_completed ? A.green : A.amber }} />
                          </div>
                          <span className="text-[11px]" style={{ color: A.textMuted }}>{u.learning_completed ? '100%' : '0%'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.learning_completed ? 'DELIVERED' : 'PENDING'} />
                      </TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Switch checked={u.learning_completed} onCheckedChange={async (checked) => { await userService.updateLearningCompleted(u.user_id, checked); setUsers(prev => prev.map(p => p.user_id === u.user_id ? { ...p, learning_completed: checked } : p)); toast.success(`Learning ${checked ? 'completed' : 'reset'}`) }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'campaigns':
        return <CampaignManager campaigns={campaigns} setCampaigns={setCampaigns} scans={scans} orders={orders} />

      case 'qr':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>QR Codes</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>Generate and manage QR codes for campaigns</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.filter(c => c.status === 'ACTIVE').map(campaign => {
                const campaignScans = scans.filter(s => s.campaign_id === campaign.id)
                const qrUrl = `https://notjust.health/scan/${campaign.id}`
                return (
                  <div key={campaign.id} className="bg-white border rounded-lg p-5 text-center hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
                    <div className="mb-4 inline-block p-3 bg-white rounded-lg border" style={{ borderColor: A.borderLight }}>
                      <QRCodeSVG value={qrUrl} size={120} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: A.text }}>{campaign.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mb-3" style={{ color: A.blue, background: A.blueLight }}>{campaign.channel}</span>
                    <div className="flex items-center justify-center gap-4 text-[11px] mb-4" style={{ color: A.textSecondary }}>
                      <span className="flex items-center gap-1"><Scan className="w-3 h-3" /> {campaignScans.length} scans</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { const svgEl = document.querySelector('svg'); if (svgEl) { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const data = new XMLSerializer().serializeToString(svgEl); const img = document.createElement('img'); img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx?.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `qr-${campaign.name}.png`; a.href = canvas.toDataURL('image/png'); a.click(); }; img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data))); } else { toast.info('Right-click QR to save'); } }}>
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(qrUrl); toast.success('QR URL copied!') }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy URL
                      </Button>
                    </div>
                  </div>
                )
              })}
              {campaigns.filter(c => c.status === 'ACTIVE').length === 0 && (
                <div className="col-span-full bg-white border rounded-lg py-16 text-center" style={{ borderColor: A.border }}>
                  <QrCode className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
                  <p className="text-sm" style={{ color: A.textMuted }}>No active campaigns. Create one to generate QR codes.</p>
                </div>
              )}
            </div>
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${A.borderLight}` }}>
                <h3 className="text-sm font-semibold" style={{ color: A.text }}>Scan History</h3>
                <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: A.textSecondary, background: A.bg }}>{scans.length} scans</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
                    <TableHead className="text-[11px]" style={{ color: A.textMuted }}>ID</TableHead>
                    <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Campaign</TableHead>
                    <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Device</TableHead>
                    <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Location</TableHead>
                    <TableHead className="text-[11px]" style={{ color: A.textMuted }}>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.slice(0, 20).map(s => (
                    <TableRow key={s.id} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                      <TableCell className="font-mono text-[11px]" style={{ color: A.textMuted }}>{s.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-[12px]" style={{ color: A.text }}>{s.campaign_id ? s.campaign_id.slice(0, 8) : '-'}</TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{s.device || '-'}</TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{s.location || '-'}</TableCell>
                      <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case 'orders':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Orders</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{orders.length} total orders</p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-md border" style={{ borderColor: A.border, background: '#fff' }}>
                <button onClick={() => setOrderView('table')} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${orderView === 'table' ? 'text-white' : ''}`} style={orderView === 'table' ? { background: A.green, color: '#fff' } : { color: A.textSecondary }}>
                  <ClipboardList className="w-3.5 h-3.5 inline mr-1" /> Table
                </button>
                <button onClick={() => setOrderView('kanban')} className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${orderView === 'kanban' ? 'text-white' : ''}`} style={orderView === 'kanban' ? { background: A.green, color: '#fff' } : { color: A.textSecondary }}>
                  <Columns3 className="w-3.5 h-3.5 inline mr-1" /> Board
                </button>
              </div>
            </div>

            {orderView === 'kanban' ? (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {orderStatuses.map(status => {
                  const statusOrders = ordersByKanbanStatus(status)
                  const c = statusColors[status] || { text: A.textMuted, bg: A.bg, dot: A.textMuted }
                  return (
                    <div key={status} className="rounded-lg p-3" style={{ background: A.bg, border: `1px solid ${A.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
                          <h3 className="text-xs font-semibold" style={{ color: c.text }}>{status}</h3>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: c.text, background: c.bg }}>{statusOrders.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {statusOrders.map((o: any) => (
                          <div key={o.id} className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow" style={{ borderColor: A.border }} onClick={() => setSelectedOrder(o)}>
                            <p className="font-mono text-[9px] mb-1" style={{ color: A.textMuted }}>{o.id.slice(0, 10)}</p>
                            <p className="text-[12px] font-medium truncate" style={{ color: A.text }}>{o.user?.name || 'Customer'}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-semibold text-[12px]" style={{ color: A.green }}>₹{o.amount?.toLocaleString()}</p>
                              <Select value={o.status} onValueChange={async (newStatus) => { await orderService.updateStatus(o.id, newStatus); setOrders(prev => prev.map(p => p.id === o.id ? { ...p, status: newStatus } : p)); toast.success('Status updated') }}>
                                <SelectTrigger className="h-5 text-[9px] w-[70px]" style={{ background: A.bg, borderColor: A.border, color: A.textSecondary }} onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                                <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                                  <SelectItem value="PENDING" style={{ color: A.text }}>Pending</SelectItem>
                                  <SelectItem value="CONFIRMED" style={{ color: A.text }}>Confirmed</SelectItem>
                                  <SelectItem value="SHIPPED" style={{ color: A.text }}>Shipped</SelectItem>
                                  <SelectItem value="DELIVERED" style={{ color: A.text }}>Delivered</SelectItem>
                                  <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                        {statusOrders.length === 0 && <p className="text-[10px] text-center py-6" style={{ color: A.textMuted }}>No orders</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Order ID</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Customer</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Amount</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Payment</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o: any) => (
                      <TableRow key={o.id} className="hover:bg-[#f8f7f5] cursor-pointer" style={{ borderColor: A.borderLight }} onClick={() => setSelectedOrder(o)}>
                        <TableCell className="font-mono text-[11px]" style={{ color: A.textMuted }}>{o.id.slice(0, 10)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{o.user?.name || 'Customer'}</TableCell>
                        <TableCell className="font-semibold text-[12px]" style={{ color: A.green }}>₹{o.amount?.toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{o.payment_method || 'N/A'}</TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
              <DialogContent className="max-w-md" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
                <DialogHeader><DialogTitle style={{ color: A.text }}>Order Details</DialogTitle></DialogHeader>
                {selectedOrder && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Order ID</span><p className="font-mono text-[11px]" style={{ color: A.text }}>{selectedOrder.id}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Customer</span><p className="font-medium" style={{ color: A.text }}>{selectedOrder.user?.name || selectedOrder.user_id}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Amount</span><p className="font-bold" style={{ color: A.green }}>₹{selectedOrder.amount?.toLocaleString()}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Status</span><StatusBadge status={selectedOrder.status} /></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Payment</span><p className="text-[11px]" style={{ color: A.text }}>{selectedOrder.payment_method || 'N/A'}</p></div>
                      <div><span className="text-[11px]" style={{ color: A.textMuted }}>Date</span><p className="text-[11px]" style={{ color: A.text }}>{new Date(selectedOrder.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <Separator style={{ background: A.border }} />
                    <Select value={selectedOrder.status} onValueChange={async (newStatus) => { await orderService.updateStatus(selectedOrder.id, newStatus); setOrders(prev => prev.map(p => p.id === selectedOrder.id ? { ...p, status: newStatus } : p)); setSelectedOrder({ ...selectedOrder, status: newStatus }); toast.success('Status updated') }}>
                      <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                        <SelectItem value="PENDING" style={{ color: A.text }}>Pending</SelectItem>
                        <SelectItem value="CONFIRMED" style={{ color: A.text }}>Confirmed</SelectItem>
                        <SelectItem value="SHIPPED" style={{ color: A.text }}>Shipped</SelectItem>
                        <SelectItem value="DELIVERED" style={{ color: A.text }}>Delivered</SelectItem>
                        <SelectItem value="CANCELLED" style={{ color: A.text }}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-4">
            <h2 className="text-base font-semibold" style={{ color: A.text }}>Analytics</h2>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Campaigns by Channel</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsBarChart data={campaignsByChannel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Bar dataKey="value" fill={A.lime} radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Scans by Campaign</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsBarChart data={scansByCampaign}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Bar dataKey="value" fill={A.green} radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Conversion Funnel</h3>
                <div className="flex items-center justify-center h-[280px]">
                  <div className="text-center">
                    <p className="text-5xl font-bold" style={{ color: A.green }}>{stats.conversionRate}%</p>
                    <p className="mt-2 text-sm" style={{ color: A.textSecondary }}>Learning Completion Rate</p>
                    <div className="mt-6 grid grid-cols-2 gap-6">
                      <div className="rounded-lg p-4" style={{ background: A.bg }}><p className="font-bold text-xl" style={{ color: A.green }}>{stats.learningCompleted}</p><p className="text-[11px]" style={{ color: A.textMuted }}>Completed</p></div>
                      <div className="rounded-lg p-4" style={{ background: A.bg }}><p className="font-bold text-xl" style={{ color: A.amber }}>{stats.totalUsers - stats.learningCompleted}</p><p className="text-[11px]" style={{ color: A.textMuted }}>Pending</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-5" style={{ borderColor: A.border }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: A.text }}>Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeebe5" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <YAxis tick={{ fontSize: 10, fill: A.textMuted }} axisLine={{ stroke: A.border }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: `1px solid ${A.border}`, borderRadius: 8, color: A.text, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke={A.green} strokeWidth={2.5} dot={{ r: 4, fill: A.green }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )

      case 'content':
        return <QuizManager questions={questions} setQuestions={setQuestions} />


      case 'products':
        const filteredProducts = adminProducts.filter(p => {
          const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.type.toLowerCase().includes(productSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.brand || '').toLowerCase().includes(productSearch.toLowerCase())
          const matchFilter = productFilter === 'all' || (productFilter === 'active' ? p.active : !p.active)
          return matchSearch && matchFilter
        })
        const getGalleryUrls = (): string[] => newProduct.gallery_images ? newProduct.gallery_images.split(',').filter(u => u.trim()) : []
        const addGalleryImage = (url: string) => { const urls = getGalleryUrls(); urls.push(url); setNewProduct({ ...newProduct, gallery_images: urls.join(',') }) }
        const removeGalleryImage = (index: number) => { const urls = getGalleryUrls(); urls.splice(index, 1); setNewProduct({ ...newProduct, gallery_images: urls.join(',') }) }
        return (
          <div className="space-y-5">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: A.text }}>Products</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{adminProducts.length} products · {adminProducts.filter(p => p.active).length} active · {adminProducts.filter(p => p.featured).length} featured</p>
              </div>
              <Dialog open={showAddProduct} onOpenChange={(open) => { setShowAddProduct(open); if (!open) resetProductForm() }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 text-xs font-bold rounded-lg shadow-sm" style={{ background: A.green, color: '#fff' }}>
                    <Plus className="w-4 h-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[92vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>{editingProduct ? 'Update product details across all tabs.' : 'Fill in the details to create a new product.'}</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className="w-full grid grid-cols-4 h-9 shrink-0">
                      <TabsTrigger value="basic" className="text-[11px] gap-1"><Package className="w-3 h-3" />Basic & Images</TabsTrigger>
                      <TabsTrigger value="pricing" className="text-[11px] gap-1"><Tag className="w-3 h-3" />Classification</TabsTrigger>
                      <TabsTrigger value="details" className="text-[11px] gap-1"><Info className="w-3 h-3" />Details</TabsTrigger>
                      <TabsTrigger value="status" className="text-[11px] gap-1"><Shield className="w-3 h-3" />Status</TabsTrigger>
                    </TabsList>

                    {/* ─── TAB 1: Basic Info & Images ─── */}
                    <TabsContent value="basic" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-1 scrollbar-thin" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                        <div className="space-y-5 p-1 pr-3">
                          {/* Main Image */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Main Product Image</Label>
                            <div className="flex items-start gap-4">
                              <div className="relative w-36 h-36 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center group cursor-pointer shrink-0" style={{ borderColor: newProduct.image_url ? A.green : A.border, background: newProduct.image_url ? 'transparent' : A.bg }}>
                                {newProduct.image_url ? (
                                  <Image src={newProduct.image_url} alt="Product" fill className="object-cover" />
                                ) : (
                                  <div className="text-center">
                                    <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: A.textMuted }} />
                                    <p className="text-[9px]" style={{ color: A.textMuted }}>Click to upload</p>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  {uploadingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Edit className="w-5 h-5 text-white" />}
                                </div>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async e => {
                                  const file = e.target.files?.[0]
                                  if (file) { const url = await handleImageUpload(file); if (url) setNewProduct({ ...newProduct, image_url: url }) }
                                }} />
                              </div>
                              <div className="flex-1 space-y-2">
                                <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full" onClick={() => {
                                  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
                                  input.onchange = async e => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) { const url = await handleImageUpload(file); if (url) setNewProduct({ ...newProduct, image_url: url }) }
                                  }
                                  input.click()
                                }} disabled={uploadingImage}>
                                  <Upload className="w-3.5 h-3.5" /> {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                </Button>
                                <Input placeholder="Or paste image URL..." value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} className="text-xs h-8" />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Gallery Images */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Gallery Images</Label>
                            <div className="flex flex-wrap gap-2">
                              {getGalleryUrls().map((url, i) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border group/gallery" style={{ borderColor: A.border }}>
                                  <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                                  <button onClick={() => removeGalleryImage(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity" style={{ background: A.destructive, color: '#fff' }}>
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                              <button className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors hover:border-current" style={{ borderColor: A.border, color: A.textMuted }} onClick={() => {
                                const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
                                input.onchange = async e => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (file) { setGalleryUploading(true); const url = await handleImageUpload(file); setGalleryUploading(false); if (url) addGalleryImage(url) }
                                }
                                input.click()
                              }} disabled={galleryUploading}>
                                {galleryUploading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </div>
                            <Input placeholder="Add gallery image URL and press Enter..." className="text-xs h-8" onKeyDown={e => {
                              if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { addGalleryImage(v); (e.target as HTMLInputElement).value = '' } }
                            }} />
                          </div>

                          <Separator />

                          {/* Basic Info */}
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Basic Information</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-name" className="text-xs mb-1">Product Name *</Label>
                                <Input id="prod-name" placeholder="e.g. NOTJUST Watr Berry Blast" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="text-sm h-9" />
                              </div>
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-short-desc" className="text-xs mb-1">Short Description</Label>
                                <Input id="prod-short-desc" placeholder="Brief one-liner for product cards" value={newProduct.short_description} onChange={e => setNewProduct({ ...newProduct, short_description: e.target.value })} className="text-sm h-9" />
                              </div>
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-desc" className="text-xs mb-1">Full Description</Label>
                                <Textarea id="prod-desc" placeholder="Detailed product description..." rows={3} value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="text-sm resize-none" />
                              </div>
                              <div>
                                <Label htmlFor="prod-brand" className="text-xs mb-1">Brand</Label>
                                <Input id="prod-brand" placeholder="e.g. NOTJUST" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-flavor" className="text-xs mb-1">Flavor</Label>
                                <Input id="prod-flavor" placeholder="e.g. Original Sparkling" value={newProduct.flavor} onChange={e => setNewProduct({ ...newProduct, flavor: e.target.value })} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>
                        </div>
                    </TabsContent>

                    {/* ─── TAB 2: Classification & Pricing ─── */}
                    <TabsContent value="pricing" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-1 scrollbar-thin" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                        <div className="space-y-5 p-1 pr-3">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Classification</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs mb-1">Product Type *</Label>
                                <Select value={newProduct.type} onValueChange={v => setNewProduct({ ...newProduct, type: v })}>
                                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {['FIZZ', 'STILL', 'BERRY', 'HERBAL', 'OTHER'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs mb-1">Category</Label>
                                <Select value={newProduct.category} onValueChange={v => setNewProduct({ ...newProduct, category: v })}>
                                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {['Wellness Shot', 'Health Drink', 'Supplement', 'Functional Beverage', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="prod-sku" className="text-xs mb-1">SKU Code</Label>
                                <Input id="prod-sku" placeholder="e.g. NJW-FIZZ-001" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="text-sm h-9 font-mono" />
                              </div>
                              <div>
                                <Label htmlFor="prod-weight" className="text-xs mb-1">Weight / Volume</Label>
                                <Input id="prod-weight" placeholder="e.g. 50ml per shot, 14 shots" value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Pricing</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="prod-price" className="text-xs mb-1">Selling Price (₹) *</Label>
                                <Input id="prod-price" type="number" placeholder="2999" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-mrp" className="text-xs mb-1">MRP (₹)</Label>
                                <Input id="prod-mrp" type="number" placeholder="3499" value={newProduct.mrp || ''} onChange={e => setNewProduct({ ...newProduct, mrp: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-stock" className="text-xs mb-1">Stock Quantity</Label>
                                <Input id="prod-stock" type="number" placeholder="500" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-discount-label" className="text-xs mb-1">Discount Label</Label>
                                <Input id="prod-discount-label" placeholder="e.g. Launch Offer, Summer Sale" value={newProduct.discount_label} onChange={e => setNewProduct({ ...newProduct, discount_label: e.target.value })} className="text-sm h-9" />
                              </div>
                            </div>
                            {newProduct.mrp && newProduct.mrp > newProduct.price && (
                              <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold" style={{ background: A.greenLight, color: A.green }}>
                                <Tag className="w-3.5 h-3.5" />
                                {Math.round((1 - newProduct.price / newProduct.mrp) * 100)}% off — Save ₹{(newProduct.mrp - newProduct.price).toLocaleString()}
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Tax & Compliance</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="prod-gst" className="text-xs mb-1">GST Rate (%)</Label>
                                <Input id="prod-gst" type="number" placeholder="18" value={newProduct.gst_rate || ''} onChange={e => setNewProduct({ ...newProduct, gst_rate: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-hsn" className="text-xs mb-1">HSN Code</Label>
                                <Input id="prod-hsn" placeholder="e.g. 2202" value={newProduct.hsn_code} onChange={e => setNewProduct({ ...newProduct, hsn_code: e.target.value })} className="text-sm h-9 font-mono" />
                              </div>
                            </div>
                          </div>
                        </div>
                    </TabsContent>

                    {/* ─── TAB 3: Product Details ─── */}
                    <TabsContent value="details" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-1 scrollbar-thin" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                        <div className="space-y-5 p-1 pr-3">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Ingredients & Nutrition</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-ingredients" className="text-xs mb-1">Ingredients</Label>
                                <Textarea id="prod-ingredients" placeholder="List key ingredients, separated by commas" rows={2} value={newProduct.ingredients} onChange={e => setNewProduct({ ...newProduct, ingredients: e.target.value })} className="text-sm resize-none" />
                              </div>
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-nutrition" className="text-xs mb-1">Nutrition Info</Label>
                                <Textarea id="prod-nutrition" placeholder="Calories, sugar, etc." rows={2} value={newProduct.nutrition_info} onChange={e => setNewProduct({ ...newProduct, nutrition_info: e.target.value })} className="text-sm resize-none" />
                              </div>
                              <div>
                                <Label htmlFor="prod-serving" className="text-xs mb-1">Serving Size</Label>
                                <Input id="prod-serving" placeholder="e.g. 50ml (1 shot)" value={newProduct.serving_size} onChange={e => setNewProduct({ ...newProduct, serving_size: e.target.value })} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Safety & Storage</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="sm:col-span-2">
                                <Label htmlFor="prod-allergen" className="text-xs mb-1">Allergen Info</Label>
                                <Textarea id="prod-allergen" placeholder="Allergen warnings..." rows={2} value={newProduct.allergen_info} onChange={e => setNewProduct({ ...newProduct, allergen_info: e.target.value })} className="text-sm resize-none" />
                              </div>
                              <div>
                                <Label htmlFor="prod-storage" className="text-xs mb-1">Storage Info</Label>
                                <Input id="prod-storage" placeholder="e.g. Store in a cool, dry place" value={newProduct.storage_info} onChange={e => setNewProduct({ ...newProduct, storage_info: e.target.value })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-shelf" className="text-xs mb-1">Shelf Life</Label>
                                <Input id="prod-shelf" placeholder="e.g. 12 months from manufacture" value={newProduct.shelf_life} onChange={e => setNewProduct({ ...newProduct, shelf_life: e.target.value })} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Origin & Compliance</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="prod-country" className="text-xs mb-1">Country of Origin</Label>
                                <Input id="prod-country" placeholder="e.g. India" value={newProduct.country_origin} onChange={e => setNewProduct({ ...newProduct, country_origin: e.target.value })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-fssai" className="text-xs mb-1">FSSAI License No.</Label>
                                <Input id="prod-fssai" placeholder="e.g. FSSAI-12345678000123" value={newProduct.fssai_license} onChange={e => setNewProduct({ ...newProduct, fssai_license: e.target.value })} className="text-sm h-9 font-mono" />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Highlights & Tags</Label>
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <Label htmlFor="prod-highlights" className="text-xs mb-1">Highlights (comma separated)</Label>
                                <Input id="prod-highlights" placeholder="e.g. Zero sugar, Zero calories, Pre-meal glycemic support" value={newProduct.highlights} onChange={e => setNewProduct({ ...newProduct, highlights: e.target.value })} className="text-sm h-9" />
                                {newProduct.highlights && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {newProduct.highlights.split(',').filter(h => h.trim()).map((h, i) => (
                                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ background: A.limeLight, color: A.green }}><Sparkles className="w-2.5 h-2.5" />{h.trim()}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="prod-tags" className="text-xs mb-1">Tags (comma separated)</Label>
                                <Input id="prod-tags" placeholder="e.g. vegan, sugar-free, natural" value={newProduct.tags} onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })} className="text-sm h-9" />
                                {newProduct.tags && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {newProduct.tags.split(',').filter(t => t.trim()).map((t, i) => (
                                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: A.bg, color: A.textSecondary }}>#{t.trim()}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    </TabsContent>

                    {/* ─── TAB 4: Status & Settings ─── */}
                    <TabsContent value="status" className="flex-1 min-h-0 mt-0 overflow-y-auto pr-1 scrollbar-thin" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                        <div className="space-y-5 p-1 pr-3">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Visibility</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center justify-between rounded-lg p-3" style={{ background: A.bg }}>
                                <div className="flex items-center gap-2">
                                  <Eye className="w-4 h-4" style={{ color: A.green }} />
                                  <div>
                                    <Label htmlFor="prod-active" className="text-xs font-medium" style={{ color: A.text }}>Active</Label>
                                    <p className="text-[10px]" style={{ color: A.textMuted }}>Visible to customers</p>
                                  </div>
                                </div>
                                <Switch id="prod-active" checked={newProduct.active} onCheckedChange={v => setNewProduct({ ...newProduct, active: v })} />
                              </div>
                              <div className="flex items-center justify-between rounded-lg p-3" style={{ background: A.bg }}>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4" style={{ color: A.lime }} />
                                  <div>
                                    <Label htmlFor="prod-featured" className="text-xs font-medium" style={{ color: A.text }}>Featured</Label>
                                    <p className="text-[10px]" style={{ color: A.textMuted }}>Highlight on storefront</p>
                                  </div>
                                </div>
                                <Switch id="prod-featured" checked={newProduct.featured} onCheckedChange={v => setNewProduct({ ...newProduct, featured: v })} />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Order Quantities</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="prod-min-qty" className="text-xs mb-1">Min Order Qty</Label>
                                <Input id="prod-min-qty" type="number" placeholder="1" value={newProduct.min_order_qty || ''} onChange={e => setNewProduct({ ...newProduct, min_order_qty: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                              <div>
                                <Label htmlFor="prod-max-qty" className="text-xs mb-1">Max Order Qty</Label>
                                <Input id="prod-max-qty" type="number" placeholder="10" value={newProduct.max_order_qty || ''} onChange={e => setNewProduct({ ...newProduct, max_order_qty: Number(e.target.value) })} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>
                        </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter className="gap-2 pt-2 border-t" style={{ borderColor: A.borderLight }}>
                    <Button variant="outline" onClick={() => { setShowAddProduct(false); resetProductForm() }} className="text-sm">Cancel</Button>
                    <Button onClick={handleSaveProduct} disabled={!newProduct.name || !newProduct.price || uploadingImage} className="text-sm font-bold gap-2" style={{ background: A.green, color: '#fff' }}>
                      {uploadingImage ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</> :
                        editingProduct ? <><Save className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Create Product</>}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* ═══ QUICK STATS ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Products', value: adminProducts.length, icon: Package, color: A.green, bg: A.greenLight },
                { label: 'Active', value: adminProducts.filter(p => p.active).length, icon: Eye, color: A.blue, bg: A.blueLight },
                { label: 'Featured', value: adminProducts.filter(p => p.featured).length, icon: Star, color: A.lime, bg: A.limeLight },
                { label: 'Out of Stock', value: adminProducts.filter(p => p.stock === 0).length, icon: AlertCircle, color: A.red, bg: A.redLight },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4 transition-shadow hover:shadow-md" style={{ background: stat.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stat.color }}>{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* ═══ SEARCH & FILTER ═══ */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: A.textMuted }} />
                <Input placeholder="Search by name, type, category, or brand..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'active', 'inactive'] as const).map(filter => (
                  <button key={filter} onClick={() => setProductFilter(filter)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${productFilter === filter ? 'text-white' : ''}`} style={productFilter === filter ? { background: A.green, color: '#fff' } : { background: A.bg, color: A.textSecondary }}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ PRODUCT CARDS GRID ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const vCount = productVideoCounts[product.id] || 0
                const qCount = productQuizCounts[product.id] || 0
                const ls = productLearningStats[product.id] || { total: 0, completed: 0, unlocked: 0 }
                const discount = product.mrp && product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0
                const productTags = product.tags ? product.tags.split(',').filter(t => t.trim()) : []
                const productHighlights = product.highlights ? product.highlights.split(',').filter(h => h.trim()) : []

                return (
                  <div key={product.id} className="rounded-xl border overflow-hidden transition-all hover:shadow-lg group" style={{ borderColor: A.border, background: '#fff' }}>
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden" style={{ background: A.bg }}>
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12" style={{ color: A.textMuted }} />
                        </div>
                      )}
                      {/* Badges overlay */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {discount > 0 && <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.red, color: '#fff' }}>{discount}% OFF</Badge>}
                        {product.featured && <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.lime, color: '#fff' }}><Sparkles className="w-2.5 h-2.5 mr-0.5" />Featured</Badge>}
                        {product.discount_label && <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: A.amber, color: '#fff' }}>{product.discount_label}</Badge>}
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="text-[9px] font-bold px-1.5 py-0 h-5 rounded-md" style={{ background: product.active ? A.green : A.red, color: '#fff' }}>
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {/* Gallery count */}
                      {product.gallery_images && product.gallery_images.split(',').filter(u => u.trim()).length > 0 && (
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 rounded-md backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.85)', borderColor: A.border, color: A.textSecondary }}>
                            <Layers className="w-2.5 h-2.5 mr-0.5" />{product.gallery_images.split(',').filter(u => u.trim()).length} photos
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      {/* Type & Category */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold rounded-md" style={{ borderColor: A.green, color: A.green }}>{product.type}</Badge>
                        {product.category && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-md" style={{ borderColor: A.border, color: A.textSecondary }}>{product.category}</Badge>}
                        {product.brand && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-md" style={{ borderColor: A.blue, color: A.blue }}>{product.brand}</Badge>}
                        {product.flavor && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-md" style={{ borderColor: A.amber, color: A.amber }}>{product.flavor}</Badge>}
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-bold leading-tight" style={{ color: A.text }}>{product.name}</h3>

                      {/* Short Description */}
                      {product.short_description && <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: A.textSecondary }}>{product.short_description}</p>}

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold" style={{ color: A.green }}>₹{product.price.toLocaleString()}</span>
                        {product.mrp && product.mrp > product.price && <span className="text-xs line-through" style={{ color: A.textMuted }}>₹{product.mrp.toLocaleString()}</span>}
                        {product.gst_rate && product.gst_rate > 0 && <span className="text-[10px]" style={{ color: A.textMuted }}>+{product.gst_rate}% GST</span>}
                      </div>

                      {/* Tags */}
                      {productTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {productTags.slice(0, 4).map((tag, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: A.bg, color: A.textSecondary }}>#{tag.trim()}</span>
                          ))}
                          {productTags.length > 4 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: A.bg, color: A.textMuted }}>+{productTags.length - 4}</span>}
                        </div>
                      )}

                      {/* Highlights */}
                      {productHighlights.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {productHighlights.slice(0, 3).map((h, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" style={{ background: A.limeLight, color: A.green }}><Check className="w-2.5 h-2.5" />{h.trim()}</span>
                          ))}
                          {productHighlights.length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: A.limeLight, color: A.green }}>+{productHighlights.length - 3}</span>}
                        </div>
                      )}

                      {/* Mini Stats */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[
                          { label: 'Videos', value: vCount, icon: Play },
                          { label: 'Quizzes', value: qCount, icon: BookOpen },
                          { label: 'Unlocked', value: ls.unlocked || 0, icon: CheckCircle },
                          { label: 'Stock', value: product.stock, icon: Package },
                        ].map(s => (
                          <div key={s.label} className="text-center p-1.5 rounded-lg" style={{ background: A.bg }}>
                            <s.icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: A.textMuted }} />
                            <p className="text-[10px] font-bold" style={{ color: A.text }}>{s.value}</p>
                            <p className="text-[8px]" style={{ color: A.textMuted }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Learning Progress */}
                      {ls.total > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span style={{ color: A.textSecondary }}>Learning Progress</span>
                            <span className="font-semibold" style={{ color: A.green }}>{ls.completed}/{ls.total}</span>
                          </div>
                          <Progress value={(ls.completed / ls.total) * 100} className="h-1.5" />
                        </div>
                      )}

                      {/* FSSAI Badge */}
                      {product.fssai_license && (
                        <div className="flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-md" style={{ background: A.bg, color: A.textMuted }}>
                          <Shield className="w-3 h-3" style={{ color: A.green }} />
                          <span>FSSAI: {product.fssai_license}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 pt-2 border-t" style={{ borderColor: A.borderLight }}>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1 hover:bg-blue-50" style={{ color: A.blue }} onClick={() => {
                          setEditingProduct(product)
                          setNewProduct({
                            name: product.name, description: product.description || '', short_description: product.short_description || '',
                            price: product.price, mrp: product.mrp || 0, stock: product.stock,
                            image_url: product.image_url || '', gallery_images: product.gallery_images || '',
                            type: product.type, category: product.category || 'Wellness Shot',
                            sku: product.sku || '', weight: product.weight || '',
                            ingredients: product.ingredients || '', nutrition_info: product.nutrition_info || '',
                            tags: product.tags || '', active: product.active, featured: product.featured || false,
                            brand: product.brand || '', flavor: product.flavor || '',
                            serving_size: product.serving_size || '', allergen_info: product.allergen_info || '',
                            storage_info: product.storage_info || '', shelf_life: product.shelf_life || '',
                            country_origin: product.country_origin || '', fssai_license: product.fssai_license || '',
                            hsn_code: product.hsn_code || '', gst_rate: product.gst_rate || 0,
                            min_order_qty: product.min_order_qty || 1, max_order_qty: product.max_order_qty || 10,
                            discount_label: product.discount_label || '', highlights: product.highlights || '',
                          })
                          setShowAddProduct(true)
                        }}>
                          <Edit className="w-3 h-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1 hover:bg-green-50" style={{ color: A.green }} onClick={() => loadLearningContent(product.id)}>
                          <BookOpen className="w-3 h-3" /> Learning
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1" style={{ color: product.active ? A.amber : A.green }} onClick={async () => {
                          const r = await productService.toggleActive(product.id)
                          if (r.data) { toast.success(`Product ${!product.active ? 'activated' : 'deactivated'}`); refreshData() }
                          else toast.error('Failed to update')
                        }}>
                          {product.active ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 flex-1 hover:bg-red-50" style={{ color: A.destructive }} onClick={async () => {
                          if (confirm('Delete this product?')) {
                            const r = await productService.delete(product.id)
                            if (r.data) { toast.success('Product deleted'); refreshData() }
                            else toast.error('Failed to delete')
                          }
                        }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Package className="w-14 h-14 mx-auto mb-3" style={{ color: A.textMuted }} />
                  <p className="text-sm font-semibold" style={{ color: A.textSecondary }}>No products found</p>
                  <p className="text-xs mt-1" style={{ color: A.textMuted }}>Try adjusting your search or filters</p>
                </div>
              )}
            </div>

            {/* ═══ MANAGE LEARNING CONTENT DIALOG ═══ */}
            <Dialog open={showManageLearning} onOpenChange={(open) => { setShowManageLearning(open); if (!open) { setLearningProductId(null); setLearningVideos([]); setLearningQuizzes([]); setShowAddVideo(false); setShowAddQuiz(false); setEditingVideo(null); setEditingQuiz(null) } }}>
              <DialogContent className="sm:max-w-[900px] max-h-[92vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-heading text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: A.green }} /> Manage Learning Content
                  </DialogTitle>
                  <DialogDescription>
                    {learningProductId ? `Manage videos and quiz questions for ${adminProducts.find(p => p.id === learningProductId)?.name || 'product'}` : 'Select a product'}
                  </DialogDescription>
                </DialogHeader>

                {learningLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-8 h-8 animate-spin" style={{ color: A.green }} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-6 pr-1" style={{ maxHeight: 'calc(92vh - 120px)' }}>
                    {/* ─── VIDEOS SECTION ─── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: A.text }}>
                          <Play className="w-4 h-4" style={{ color: A.green }} /> Videos ({learningVideos.length})
                        </h3>
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.green, color: '#fff' }} onClick={() => { setShowAddVideo(true); setEditingVideo(null); setNewVideo({ title: '', duration: '', description: '', order: learningVideos.length + 1, video_url: '' }) }}>
                          <Plus className="w-3 h-3" /> Add Video
                        </Button>
                      </div>

                      {learningVideos.length === 0 ? (
                        <div className="text-center py-8 rounded-lg" style={{ background: A.bg }}>
                          <Play className="w-8 h-8 mx-auto mb-2" style={{ color: A.textMuted }} />
                          <p className="text-xs" style={{ color: A.textMuted }}>No videos yet. Add one above.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {learningVideos.map((video, idx) => (
                            <div key={video.id} className="flex items-start gap-2 p-3 rounded-lg border group" style={{ borderColor: A.borderLight, background: '#fff' }}>
                              <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                                <button onClick={() => handleReorderVideo(video.id, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                                <button onClick={() => handleReorderVideo(video.id, 'down')} disabled={idx === learningVideos.length - 1} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-3 h-3" style={{ color: A.textMuted }} /></button>
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: A.greenLight, color: A.green }}>{video.order}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold truncate" style={{ color: A.text }}>{video.title}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0" style={{ borderColor: A.border, color: A.textMuted }}>{video.duration}</Badge>
                                </div>
                                <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: A.textMuted }}>{video.description}</p>
                                {video.video_url && <p className="text-[9px] mt-0.5 truncate" style={{ color: A.blue }}>{video.video_url}</p>}
                                {/* Quizzes for this video */}
                                {learningQuizzes.filter(q => q.video_id === video.id).length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: A.textSecondary }}>Quiz Questions ({learningQuizzes.filter(q => q.video_id === video.id).length})</p>
                                    {learningQuizzes.filter(q => q.video_id === video.id).map((quiz, qIdx) => {
                                      const allQuizzesForVideo = learningQuizzes.filter(q => q.video_id === video.id)
                                      return (
                                        <div key={quiz.id} className="flex items-start gap-1.5 p-2 rounded-md border" style={{ borderColor: A.borderLight, background: A.bg }}>
                                          <div className="flex flex-col gap-0 shrink-0 pt-0.5">
                                            <button onClick={() => handleReorderQuiz(quiz.id, 'up')} disabled={qIdx === 0} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-2.5 h-2.5" style={{ color: A.textMuted }} /></button>
                                            <button onClick={() => handleReorderQuiz(quiz.id, 'down')} disabled={qIdx === allQuizzesForVideo.length - 1} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-2.5 h-2.5" style={{ color: A.textMuted }} /></button>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium" style={{ color: A.text }}>{quiz.question}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {quiz.options.map((opt, oi) => (
                                                <span key={oi} className={`text-[9px] px-1.5 py-0.5 rounded ${oi === quiz.answer ? 'font-bold' : ''}`} style={{ background: oi === quiz.answer ? A.limeLight : A.bg, color: oi === quiz.answer ? A.green : A.textMuted, border: oi === quiz.answer ? `1px solid ${A.lime}` : '1px solid transparent' }}>
                                                  {String.fromCharCode(65 + oi)}: {opt}
                                                </span>
                                              ))}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                              {quiz.category && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3" style={{ borderColor: A.blue, color: A.blue }}>{quiz.category}</Badge>}
                                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3" style={{ borderColor: quiz.difficulty === 'EASY' ? A.green : quiz.difficulty === 'MEDIUM' ? A.amber : A.red, color: quiz.difficulty === 'EASY' ? A.green : quiz.difficulty === 'MEDIUM' ? A.amber : A.red }}>{quiz.difficulty}</Badge>
                                            </div>
                                          </div>
                                          <div className="flex gap-0.5 shrink-0">
                                            <button className="p-1 rounded hover:bg-blue-50" style={{ color: A.blue }} onClick={() => { setEditingQuiz(quiz); setShowAddQuiz(true); setNewQuiz({ question: quiz.question, options: [...quiz.options, '', '', '', ''].slice(0, 4), answer: quiz.answer, category: quiz.category || '', difficulty: quiz.difficulty, order: quiz.order, video_id: quiz.video_id }) }}><Edit className="w-3 h-3" /></button>
                                            <button className="p-1 rounded hover:bg-red-50" style={{ color: A.red }} onClick={() => handleDeleteQuiz(quiz.id)}><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                <button className="p-1.5 rounded hover:bg-blue-50" style={{ color: A.blue }} onClick={() => { setEditingVideo(video); setShowAddVideo(true); setNewVideo({ title: video.title, duration: video.duration, description: video.description, order: video.order, video_url: video.video_url || '' }) }}><Edit className="w-3.5 h-3.5" /></button>
                                <button className="p-1.5 rounded hover:bg-red-50" style={{ color: A.red }} onClick={() => handleDeleteVideo(video.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─── ADD/EDIT VIDEO FORM ─── */}
                    {showAddVideo && (
                      <div className="p-4 rounded-lg border" style={{ borderColor: A.lime, background: A.limeLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.green }}>
                          <Play className="w-3.5 h-3.5" /> {editingVideo ? 'Edit Video' : 'Add Video'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1">Title *</Label>
                            <Input placeholder="e.g. Introduction to Product" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Duration</Label>
                            <Input placeholder="e.g. 4:32" value={newVideo.duration} onChange={e => setNewVideo({ ...newVideo, duration: e.target.value })} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Order</Label>
                            <Input type="number" value={newVideo.order} onChange={e => setNewVideo({ ...newVideo, order: Number(e.target.value) })} className="h-8 text-sm" />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1">Description</Label>
                            <Textarea placeholder="Video description..." rows={2} value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} className="text-sm resize-none" />
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs mb-1">Video URL</Label>
                            <Input placeholder="https://..." value={newVideo.video_url} onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="text-xs h-7" style={{ background: A.green, color: '#fff' }} onClick={handleSaveVideo}>
                            <Save className="w-3 h-3 mr-1" /> {editingVideo ? 'Update' : 'Add'} Video
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddVideo(false); setEditingVideo(null) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD/EDIT QUIZ FORM ─── */}
                    {showAddQuiz && (
                      <div className="p-4 rounded-lg border" style={{ borderColor: A.blue, background: A.blueLight }}>
                        <h4 className="text-xs font-bold mb-3 flex items-center gap-1" style={{ color: A.blue }}>
                          <BookOpen className="w-3.5 h-3.5" /> {editingQuiz ? 'Edit Quiz Question' : 'Add Quiz Question'}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label className="text-xs mb-1">Question *</Label>
                            <Input placeholder="e.g. What is the main benefit of this product?" value={newQuiz.question} onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs mb-1">Linked Video *</Label>
                            <Select value={newQuiz.video_id} onValueChange={v => setNewQuiz({ ...newQuiz, video_id: v })}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select video..." /></SelectTrigger>
                              <SelectContent>
                                {learningVideos.map(v => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {newQuiz.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button onClick={() => setNewQuiz({ ...newQuiz, answer: i })} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold border-2 transition-colors" style={{ borderColor: i === newQuiz.answer ? A.green : A.border, background: i === newQuiz.answer ? A.greenLight : 'transparent', color: i === newQuiz.answer ? A.green : A.textMuted }}>
                                  {String.fromCharCode(65 + i)}
                                </button>
                                <Input placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => { const opts = [...newQuiz.options]; opts[i] = e.target.value; setNewQuiz({ ...newQuiz, options: opts }) }} className="h-8 text-sm flex-1" />
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px]" style={{ color: A.textMuted }}>Click the letter circle to mark the correct answer.</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs mb-1">Category</Label>
                              <Input placeholder="e.g. intro, usage, science" value={newQuiz.category} onChange={e => setNewQuiz({ ...newQuiz, category: e.target.value })} className="h-8 text-sm" />
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Difficulty</Label>
                              <Select value={newQuiz.difficulty} onValueChange={v => setNewQuiz({ ...newQuiz, difficulty: v })}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['EASY', 'MEDIUM', 'HARD'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs mb-1">Order</Label>
                              <Input type="number" value={newQuiz.order} onChange={e => setNewQuiz({ ...newQuiz, order: Number(e.target.value) })} className="h-8 text-sm" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="text-xs h-7" style={{ background: A.blue, color: '#fff' }} onClick={handleSaveQuiz}>
                            <Save className="w-3 h-3 mr-1" /> {editingQuiz ? 'Update' : 'Add'} Question
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowAddQuiz(false); setEditingQuiz(null) }}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* ─── ADD QUIZ BUTTON ─── */}
                    {!showAddQuiz && learningVideos.length > 0 && (
                      <div className="flex justify-center pt-2">
                        <Button size="sm" className="text-xs gap-1 h-7" style={{ background: A.blue, color: '#fff' }} onClick={() => { setShowAddQuiz(true); setEditingQuiz(null); setNewQuiz({ question: '', options: ['', '', '', ''], answer: 0, category: '', difficulty: 'EASY', order: 1, video_id: learningVideos[0]?.id || '' }) }}>
                          <Plus className="w-3 h-3" /> Add Quiz Question
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )

      case 'subscriptions':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{ color: A.text }}>Subscriptions</h2>
                <p className="text-[12px]" style={{ color: A.textMuted }}>{adminSubscriptions.length} total subscriptions</p>
              </div>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Active', value: adminSubscriptions.filter(s => s.status === 'ACTIVE').length, color: A.green, bgColor: A.greenLight },
                { label: 'Paused', value: adminSubscriptions.filter(s => s.status === 'PAUSED').length, color: A.amber, bgColor: A.amberLight },
                { label: 'Revenue', value: `₹${adminSubscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString()}`, color: A.blue, bgColor: A.blueLight },
                { label: 'Auto-Renew', value: adminSubscriptions.filter(s => s.auto_renew).length, color: A.lime, bgColor: A.limeLight },
              ].map(card => (
                <div key={card.label} className="bg-white border rounded-lg p-4" style={{ borderColor: A.border }}>
                  <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2" style={{ backgroundColor: card.bgColor }}>
                    <CreditCard className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="text-xl font-bold" style={{ color: A.text }}>{card.value}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: A.textMuted }}>{card.label}</p>
                </div>
              ))}
            </div>
            {/* Subscription Table */}
            <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>ID</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>User</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Product</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Pack</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>End Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Auto-Renew</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminSubscriptions.map(sub => {
                    const subUser = users.find((u: any) => u.user_id === sub.user_id)
                    const subProduct = adminProducts.find(p => p.id === sub.product_id)
                    return (
                      <TableRow key={sub.id} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                        <TableCell className="font-mono text-[10px]" style={{ color: A.textMuted }}>{sub.id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{subUser?.name || sub.user_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[12px]" style={{ color: A.text }}>{subProduct?.name || sub.product_id?.slice(0, 8)}</TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>{sub.pack_type}</TableCell>
                        <TableCell className="font-semibold text-[12px]" style={{ color: A.green }}>₹{(sub.amount || 0).toLocaleString()}</TableCell>
                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                        <TableCell className="text-[11px]" style={{ color: A.textMuted }}>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={sub.auto_renew}
                            onCheckedChange={async (checked) => {
                              await subscriptionService.toggleAutoRenew(sub.id)
                              setAdminSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, auto_renew: checked } : s))
                              toast.success(`Auto-renew ${checked ? 'enabled' : 'disabled'}`)
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {adminSubscriptions.length === 0 && (
                <div className="py-16 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
                  <p className="text-sm" style={{ color: A.textMuted }}>No subscriptions yet.</p>
                </div>
              )}
            </div>
          </div>
        )

      default: return null
    }
  }

  return (
    <div className="min-h-screen flex font-[family-name:var(--font-admin)]" style={{ background: A.bg }}>
      {/* Sidebar — Dark */}
      <aside className={`${sidebarCollapsed ? 'w-[56px]' : 'w-[220px]'} flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-200`} style={{ background: A.sidebarBg, borderRight: '1px solid #2a2926' }}>
        <div className="px-3 py-3 flex items-center gap-2.5 h-[52px]" style={{ borderBottom: '1px solid #2a2926' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: A.green }}>
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[12px] text-white truncate">NotJust</p>
              <p className="text-[8px]" style={{ color: '#6b6560' }}>Admin Console</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#2a2926] transition-colors flex-shrink-0" style={{ color: '#6b6560' }}>
            <ChevronLeft className={`w-3 h-3 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map(item => (
            <button key={item.value} onClick={() => setAdminTab(item.value)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all`} style={adminTab === item.value ? { background: A.green, color: '#fff' } : { color: A.sidebarText, background: 'transparent' }} onMouseEnter={e => { if (adminTab !== item.value) (e.currentTarget as HTMLElement).style.background = A.sidebarHover }} onMouseLeave={e => { if (adminTab !== item.value) (e.currentTarget as HTMLElement).style.background = 'transparent' }} title={sidebarCollapsed ? item.label : undefined}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && (<><span className="flex-1 text-left">{item.label}</span>{item.badge !== null && (<span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded`} style={adminTab === item.value ? { background: 'rgba(255,255,255,0.2)', color: '#fff' } : { background: '#2a2926', color: '#6b6560' }}>{item.badge}</span>)}</>)}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3" style={{ borderTop: '1px solid #2a2926' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: A.greenLight }}>
              <span className="font-bold text-[10px]" style={{ color: A.green }}>{user?.name?.charAt(0) || 'A'}</span>
            </div>
            {!sidebarCollapsed && (<div className="flex-1 min-w-0"><p className="text-[11px] font-medium text-white truncate">{user?.name || 'Admin'}</p><p className="text-[9px]" style={{ color: '#6b6560' }}>Administrator</p></div>)}
          </div>
        </div>
      </aside>

      {/* Main Area — Light */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <div className="bg-white border-b px-5 h-[52px] flex items-center justify-between sticky top-0 z-10" style={{ borderColor: A.border }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: A.greenLight }}>
                {(() => { const Item = sidebarItems.find(i => i.value === adminTab); return Item ? <Item.icon className="w-3 h-3" style={{ color: A.green }} /> : null })()}
              </div>
              <span className="font-semibold text-[13px]" style={{ color: A.text }}>{sidebarItems.find(i => i.value === adminTab)?.label || 'Overview'}</span>
            </div>
            <div className="h-4 w-px" style={{ background: A.border }} />
            <span className="text-[11px]" style={{ color: A.textMuted }}>
              {adminTab === 'dashboard' && `${stats.totalUsers} users · ${stats.totalOrders} orders · ₹${stats.totalRevenue?.toLocaleString()} revenue`}
              {adminTab === 'users' && `${filteredUsers.length} shown`}
              {adminTab === 'campaigns' && `${campaigns.length} campaigns`}
              {adminTab === 'products' && `${adminProducts.length} products`}
              {adminTab === 'qr' && `${campaigns.filter(c => c.status === 'ACTIVE').length} QR codes`}
              {adminTab === 'orders' && `${orders.length} orders`}
              {adminTab === 'subscriptions' && `${adminSubscriptions.length} subscriptions`}
              {adminTab === 'analytics' && 'Real-time analytics'}
              {adminTab === 'content' && `${questions.length} questions`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {adminTab !== 'dashboard' && (
              <>
                <button onClick={() => {
                  if (adminTab === 'users') exportToCSV(filteredUsers, 'notjust-users', [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'country', label: 'Country' }, { key: 'state', label: 'State' }, { key: 'learning_completed', label: 'Learning Completed' }, { key: 'created_at', label: 'Joined' }])
                  else if (adminTab === 'orders') exportToCSV(orders, 'notjust-orders', [{ key: 'id', label: 'Order ID' }, { key: 'user_id', label: 'User ID' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'payment_gateway', label: 'Payment Gateway' }, { key: 'created_at', label: 'Date' }])
                  else if (adminTab === 'campaigns') exportToCSV(campaigns, 'notjust-campaigns', [{ key: 'name', label: 'Name' }, { key: 'channel', label: 'Channel' }, { key: 'partner_name', label: 'Partner' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created' }])
                  else if (adminTab === 'qr') exportToCSV(scans, 'notjust-qr-scans', [{ key: 'id', label: 'Scan ID' }, { key: 'campaign_id', label: 'Campaign ID' }, { key: 'device', label: 'Device' }, { key: 'location', label: 'Location' }, { key: 'created_at', label: 'Date' }])
                  else if (adminTab === 'analytics') exportToCSV([...orders.map(o => ({ month: new Date(o.created_at).toLocaleDateString('en', { month: 'short' }), revenue: o.amount, status: o.status }))], 'notjust-analytics', [{ key: 'month', label: 'Month' }, { key: 'revenue', label: 'Revenue' }, { key: 'status', label: 'Status' }])
                  else if (adminTab === 'content') exportToCSV(questions, 'notjust-quiz-questions', [{ key: 'question', label: 'Question' }, { key: 'category', label: 'Category' }, { key: 'difficulty', label: 'Difficulty' }, { key: 'answer', label: 'Answer Index' }])
                }} className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textSecondary }} title="Export CSV">
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button onClick={() => exportToPDF(sidebarItems.find(i => i.value === adminTab)?.label || 'Report')} className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textSecondary }} title="Export PDF">
                  <FileText className="w-3 h-3" /> PDF
                </button>
              </>
            )}
            <button onClick={() => navigateTo('landing')} className="w-7 h-7 rounded-md flex items-center justify-center border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textMuted }} title="Back to site"><ExternalLink className="w-3.5 h-3.5" /></button>
            <button onClick={refreshData} className="w-7 h-7 rounded-md flex items-center justify-center border transition-colors hover:bg-[#f8f7f5]" style={{ borderColor: A.border, color: A.textMuted }} title="Refresh data"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="p-5" data-admin-content>{renderContent()}</div>
      </main>
    </div>
  )
}

// ============================================================
// CAMPAIGN MANAGER — Light Theme
// ============================================================
function CampaignManager({ campaigns, setCampaigns, scans, orders }: { campaigns: Campaign[]; setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; scans: QrScan[]; orders: any[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState({ name: '', channel: 'HOTEL', partner_name: '', location: '' })
  const [campaignSales, setCampaignSales] = useState<Record<string, { orderCount: number; revenue: number }>>({})

  // Fetch campaign sales data
  useEffect(() => {
    campaignService.getCampaignSales().then(r => {
      if (r.data) setCampaignSales(r.data as any)
    })
  }, [orders, scans])

  // Compute sales per campaign from orders + scans data
  const getCampaignSalesInfo = (campaignId: string) => {
    // Find all users who scanned this campaign's QR
    const campaignUserIds = scans
      .filter(s => s.campaign_id === campaignId && s.user_id)
      .map(s => s.user_id!)

    // Find orders from those users (only confirmed/shipped/delivered)
    const campaignOrders = orders.filter((o: any) =>
      campaignUserIds.includes(o.user_id) &&
      ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)
    )

    const totalRevenue = campaignOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
    return {
      orderCount: campaignOrders.length,
      revenue: totalRevenue,
    }
  }

  const handleCreate = async () => {
    if (!form.name) { toast.error('Campaign name is required'); return }
    const result = await campaignService.create(form as any)
    if (result.data) {
      setCampaigns(prev => [result.data as Campaign, ...prev])
      toast.success('Campaign created with QR code')
      setDialogOpen(false)
      setForm({ name: '', channel: 'HOTEL', partner_name: '', location: '' })
    }
  }

  const toggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'
    await campaignService.updateStatus(id, newStatus)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    toast.success('Status updated')
  }

  const channelIcons: Record<string, string> = {
    HOTEL: '🏨', HOSPITAL: '🏥', CLINIC: '🏥', DOCTOR: '👨‍⚕️',
    EVENT: '🎉', CORPORATE: '🏢', INFLUENCER: '📱', WELLNESS: '🧘',
  }

  // Summary stats
  const totalSales = Object.values(campaignSales).reduce((sum, s) => sum + s.orderCount, 0)
  const totalRevenue = Object.values(campaignSales).reduce((sum, s) => sum + s.revenue, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: A.text }}>Campaigns</h2>
          <p className="text-[12px]" style={{ color: A.textMuted }}>{campaigns.length} total campaigns · {totalSales} sales · ₹{totalRevenue.toLocaleString()} revenue</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-md text-[12px] h-8 text-white" style={{ background: A.green }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent style={{ background: '#fff', borderColor: A.border, color: A.text }}>
            <DialogHeader><DialogTitle style={{ color: A.text }}>Create Campaign</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Campaign name" className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="space-y-1.5">
                <Label style={{ color: A.textSecondary }}>Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                    {['HOTEL', 'HOSPITAL', 'CLINIC', 'DOCTOR', 'EVENT', 'CORPORATE', 'INFLUENCER', 'WELLNESS'].map(c => <SelectItem key={c} value={c} style={{ color: A.text }}>{channelIcons[c]} {c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Partner</Label><Input value={form.partner_name} onChange={e => setForm(p => ({ ...p, partner_name: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: A.greenLight, border: `1px solid ${A.green}20` }}>
                <QrCode className="w-4 h-4" style={{ color: A.green }} />
                <span className="text-[11px]" style={{ color: A.green }}>QR code will be auto-generated for this campaign</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-md text-white" style={{ background: A.green }}>Create & Generate QR</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {campaigns.map(campaign => {
          const campaignScans = scans.filter(s => s.campaign_id === campaign.id)
          const salesInfo = getCampaignSalesInfo(campaign.id)
          const qrUrl = `https://notjust.health/scan/${campaign.id}`
          return (
            <div key={campaign.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow" style={{ borderColor: A.border }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-white rounded-md border" style={{ borderColor: A.borderLight }}>
                  <QRCodeSVG value={qrUrl} size={56} bgColor="#ffffff" fgColor="#1f1e1c" level="L" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate" style={{ color: A.text }}>{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{channelIcons[campaign.channel] || '📋'} {campaign.channel}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: A.textMuted }}>{campaign.partner_name || 'No partner'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: A.textSecondary }}>
                    <span className="flex items-center gap-1"><Scan className="w-2.5 h-2.5" /> {campaignScans.length}</span>
                    <span className="flex items-center gap-1"><Package className="w-2.5 h-2.5" /> {salesInfo.orderCount}</span>
                    {salesInfo.orderCount > 0 && (
                      <span className="flex items-center gap-1" style={{ color: A.green }}><DollarSign className="w-2.5 h-2.5" /> ₹{salesInfo.revenue.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${A.borderLight}` }}>
                <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded" style={campaign.status === 'ACTIVE' ? { color: A.green, background: A.greenLight } : { color: A.textMuted, background: A.bg }}>{campaign.status}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => setDetailCampaign(campaign)}><Eye className="w-3 h-3 mr-0.5" /> View</Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" style={{ color: A.textSecondary }} onClick={() => toggleStatus(campaign.id, campaign.status)}>{campaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}</Button>
                </div>
              </div>
            </div>
          )
        })}
        {campaigns.length === 0 && (
          <div className="col-span-full bg-white border rounded-lg py-16 text-center" style={{ borderColor: A.border }}>
            <MegaphoneIcon className="w-10 h-10 mx-auto mb-3" style={{ color: A.border }} />
            <p className="text-sm" style={{ color: A.textMuted }}>No campaigns yet. Create one to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-lg" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
          <DialogHeader><DialogTitle style={{ color: A.text }}>Campaign Details</DialogTitle></DialogHeader>
          {detailCampaign && (() => {
            const detailSales = getCampaignSalesInfo(detailCampaign.id)
            const detailScans = scans.filter(s => s.campaign_id === detailCampaign.id)
            // Get unique users who scanned
            const scanUsers = [...new Set(detailScans.filter(s => s.user_id).map(s => s.user_id))]
            // Get orders from those users
            const detailOrders = orders.filter((o: any) =>
              scanUsers.includes(o.user_id) &&
              ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status)
            )
            return (
              <div className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-white rounded-lg border" style={{ borderColor: A.border }}>
                    <QRCodeSVG value={`https://notjust.health/scan/${detailCampaign.id}`} size={130} bgColor="#ffffff" fgColor="#1f1e1c" level="M" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg" style={{ color: A.text }}>{detailCampaign.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{channelIcons[detailCampaign.channel] || '📋'} {detailCampaign.channel}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded" style={detailCampaign.status === 'ACTIVE' ? { color: A.green, background: A.greenLight } : { color: A.textMuted, background: A.bg }}>{detailCampaign.status}</span>
                    </div>
                    <div className="text-[12px] space-y-1" style={{ color: A.textSecondary }}>
                      <p>Partner: {detailCampaign.partner_name || '-'}</p>
                      <p>Location: {detailCampaign.location || '-'}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => { navigator.clipboard.writeText(`https://notjust.health/scan/${detailCampaign.id}`); toast.success('QR URL copied!') }}>
                        <Copy className="w-3 h-3 mr-1" /> Copy URL
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-md text-[11px] h-8" style={{ borderColor: A.border, color: A.text }} onClick={() => toggleStatus(detailCampaign.id, detailCampaign.status)}>
                        {detailCampaign.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Campaign Performance Stats */}
                <div style={{ borderTop: `1px solid ${A.borderLight}` }} className="pt-4">
                  <h4 className="text-sm font-semibold mb-3" style={{ color: A.text }}>Campaign Performance</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg p-3 text-center" style={{ background: A.bg }}>
                      <p className="text-xl font-bold" style={{ color: A.blue }}>{detailScans.length}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>QR Scans</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: A.greenLight }}>
                      <p className="text-xl font-bold" style={{ color: A.green }}>{detailSales.orderCount}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Sales</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ background: A.limeLight }}>
                      <p className="text-xl font-bold" style={{ color: A.lime }}>₹{detailSales.revenue.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: A.textMuted }}>Revenue</p>
                    </div>
                  </div>
                  {detailScans.length > 0 && (
                    <div className="mt-2 text-[10px] text-center" style={{ color: A.textMuted }}>
                      Conversion rate: {detailScans.length > 0 ? ((detailSales.orderCount / scanUsers.length) * 100).toFixed(0) : 0}% (scanned users who purchased)
                    </div>
                  )}
                </div>

                {/* Recent Orders from this campaign */}
                {detailOrders.length > 0 && (
                  <div style={{ borderTop: `1px solid ${A.borderLight}` }} className="pt-4">
                    <h4 className="text-sm font-semibold mb-2" style={{ color: A.text }}>Recent Orders ({detailOrders.length})</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {detailOrders.slice(0, 5).map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between p-2 rounded-md" style={{ background: A.bg }}>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" style={{ color: A.textMuted }} />
                            <span className="text-[11px] font-medium" style={{ color: A.text }}>{o.user?.name || o.user_id?.slice(0, 12)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold" style={{ color: A.green }}>₹{o.amount?.toLocaleString()}</span>
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{
                              color: o.status === 'DELIVERED' ? A.green : o.status === 'SHIPPED' ? '#7c3aed' : A.blue,
                              background: o.status === 'DELIVERED' ? A.greenLight : o.status === 'SHIPPED' ? '#f3f0ff' : A.blueLight,
                            }}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// QUIZ MANAGER — Light Theme
// ============================================================
function QuizManager({ questions, setQuestions }: { questions: QuizQuestion[]; setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>> }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '0', category: 'usage', difficulty: 'EASY' })
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  const handleCreate = async () => {
    if (!form.question || !form.option1) { toast.error('Question and at least option 1 are required'); return }
    const result = await quizService.createQuestion({
      question: form.question,
      options: [form.option1, form.option2, form.option3, form.option4].filter(Boolean),
      answer: parseInt(form.answer),
      category: form.category,
      difficulty: form.difficulty,
    } as any)
    if (result.data) {
      setQuestions(prev => [...prev, result.data as QuizQuestion])
      toast.success('Question created')
      setDialogOpen(false)
      setForm({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '0', category: 'usage', difficulty: 'EASY' })
    }
  }

  const filtered = questions.filter(q => {
    if (filterCategory !== 'all' && q.category !== filterCategory) return false
    if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
    return true
  })

  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category).filter(Boolean)))]
  const difficulties = ['all', ...Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean)))]

  const difficultyColors: Record<string, { text: string; bg: string }> = {
    EASY: { text: A.green, bg: A.greenLight },
    MEDIUM: { text: A.amber, bg: A.amberLight },
    HARD: { text: A.red, bg: A.redLight },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: A.text }}>Quiz Questions</h2>
          <p className="text-[12px]" style={{ color: A.textMuted }}>{questions.length} total questions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-md text-[12px] h-8 text-white" style={{ background: A.green }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" style={{ background: '#fff', borderColor: A.border, color: A.text }}>
            <DialogHeader><DialogTitle style={{ color: A.text }}>Add Quiz Question</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1.5"><Label style={{ color: A.textSecondary }}>Question</Label><Textarea value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} /></div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1.5">
                  <Label style={{ color: A.textSecondary }}>Option {i}{i === 1 && ' *'}</Label>
                  <Input value={(form as any)[`option${i}`]} onChange={e => setForm(p => ({ ...p, [`option${i}`]: e.target.value }))} className="rounded-md" style={{ borderColor: A.border, color: A.text }} />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label style={{ color: A.textSecondary }}>Correct</Label>
                  <Select value={form.answer} onValueChange={v => setForm(p => ({ ...p, answer: v }))}>
                    <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                    <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                      <SelectItem value="0" style={{ color: A.text }}>Option 1</SelectItem>
                      <SelectItem value="1" style={{ color: A.text }}>Option 2</SelectItem>
                      <SelectItem value="2" style={{ color: A.text }}>Option 3</SelectItem>
                      <SelectItem value="3" style={{ color: A.text }}>Option 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label style={{ color: A.textSecondary }}>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                    <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                      <SelectItem value="usage" style={{ color: A.text }}>Usage</SelectItem>
                      <SelectItem value="science" style={{ color: A.text }}>Science</SelectItem>
                      <SelectItem value="product" style={{ color: A.text }}>Product</SelectItem>
                      <SelectItem value="health" style={{ color: A.text }}>Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label style={{ color: A.textSecondary }}>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v }))}>
                    <SelectTrigger className="rounded-md" style={{ borderColor: A.border, color: A.text }}><SelectValue /></SelectTrigger>
                    <SelectContent style={{ background: '#fff', borderColor: A.border }}>
                      <SelectItem value="EASY" style={{ color: A.text }}>Easy</SelectItem>
                      <SelectItem value="MEDIUM" style={{ color: A.text }}>Medium</SelectItem>
                      <SelectItem value="HARD" style={{ color: A.text }}>Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} className="rounded-md text-white" style={{ background: A.green }}>Create Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36 rounded-md h-8 text-[11px]" style={{ background: '#fff', borderColor: A.border, color: A.text }}><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent style={{ background: '#fff', borderColor: A.border }}>
            {categories.map(c => <SelectItem key={c} value={c} style={{ color: A.text }}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-32 rounded-md h-8 text-[11px]" style={{ background: '#fff', borderColor: A.border, color: A.text }}><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent style={{ background: '#fff', borderColor: A.border }}>
            {difficulties.map(d => <SelectItem key={d} value={d} style={{ color: A.text }}>{d === 'all' ? 'All Levels' : d}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: A.textSecondary, background: A.bg }}>{filtered.length} shown</span>
      </div>

      {/* Questions Table */}
      <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: A.border }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ borderColor: A.borderLight }}>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Question</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Category</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Difficulty</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: A.textMuted }}>Answer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((q, idx) => (
              <TableRow key={q.id || idx} className="hover:bg-[#f8f7f5]" style={{ borderColor: A.borderLight }}>
                <TableCell className="text-[12px] max-w-md truncate" style={{ color: A.text }}>{q.question}</TableCell>
                <TableCell><span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: A.blue, background: A.blueLight }}>{q.category || '-'}</span></TableCell>
                <TableCell><span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={difficultyColors[q.difficulty] || { color: A.textMuted, background: A.bg }}>{q.difficulty || '-'}</span></TableCell>
                <TableCell className="text-[11px]" style={{ color: A.textSecondary }}>Option {(q.answer || 0) + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}



// ============================================================
// PROFILE
// ============================================================
function ProfileView() {
  const { user, navigateTo, setUser } = useAppStore()
  const [orders, setOrders] = useState<any[]>([])
  const [learning, setLearning] = useState<LearningProgress | null>(null)

  useEffect(() => {
    if (!user) return
    orderService.getByUser(user.user_id).then(r => r.data && setOrders(r.data))
    learningService.getProgress(user.user_id).then(r => r.data && setLearning(r.data))
  }, [user])

  if (!user) { navigateTo('auth-login'); return null }

  return (
    <div className="min-h-screen bg-[#f4f3f0] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-[#1f1e1c] mb-8">My Profile</h1>

          <div className="grid md:grid-cols-3 gap-6">
            {/* User Info */}
            <Card className="border-[#e3dfd8] md:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#48805b] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">{user.name.charAt(0)}</span>
                </div>
                <h2 className="font-bold text-xl text-[#1f1e1c]">{user.name}</h2>
                <p className="text-sm text-[#88837b]">{user.email || user.phone}</p>
                <div className="mt-4 space-y-2 text-sm text-left">
                  {user.age && <p><span className="text-[#88837b]">Age:</span> {user.age}</p>}
                  {user.gender && <p><span className="text-[#88837b]">Gender:</span> {user.gender}</p>}
                  {user.country && <p><span className="text-[#88837b]">Country:</span> {user.country}</p>}
                  {user.state && <p><span className="text-[#88837b]">State:</span> {user.state}</p>}
                </div>
                {user.learning_completed && (
                  <Badge className="mt-4 bg-[#48805b]/10 text-[#48805b]">
                    <CheckCircle className="w-3 h-3 mr-1" /> Learning Complete
                  </Badge>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-6">
              {/* Learning Progress */}
              <Card className="border-[#e3dfd8]">
                <CardHeader><CardTitle className="text-base">Learning Progress</CardTitle></CardHeader>
                <CardContent>
                  {learning ? (
                    <div className="space-y-3">
                      {VIDEO_MODULES.map(v => (
                        <div key={v.id} className="flex items-center gap-3">
                          <span className="text-sm w-32">{v.title}</span>
                          <Progress value={learning.video_progress?.[v.id] || 0} className="flex-1 h-2" />
                          <span className="text-xs text-[#88837b] w-10 text-right">{learning.video_progress?.[v.id] || 0}%</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-sm w-32">Quiz</span>
                        {learning.quiz_completed ? (
                          <Badge className="bg-[#48805b]/10 text-[#48805b]">Score: {learning.quiz_score}%</Badge>
                        ) : (
                          <Badge variant="secondary">Not completed</Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#88837b]">No learning progress yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Order History */}
              <Card className="border-[#e3dfd8]">
                <CardHeader><CardTitle className="text-base">Order History</CardTitle></CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-sm text-[#88837b]">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f4f3f0] border border-[#e3dfd8]">
                          <div>
                            <p className="font-medium text-sm">{o.id}</p>
                            <p className="text-xs text-[#88837b]">{new Date(o.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{o.amount?.toLocaleString()}</p>
                            <Badge className={`text-[10px] ${o.status === 'DELIVERED' ? 'bg-[#48805b]/10 text-[#48805b]' : 'bg-[#e3dfd8] text-[#88837b]'}`}>
                              {o.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN APP
// ============================================================
export default function HomePage() {
  const { currentView } = useAppStore()
  const [dbReady, setDbReady] = useState(false)

  useEffect(() => {
    initDataService().then((connected) => {
      setDbReady(true)
      if (connected) {
        console.log('[NotJust] Connected to Supabase')
      } else {
        console.log('[NotJust] Using mock data (Supabase tables not found)')
      }
    })
  }, [])

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingPage />
      case 'auth-login': return <AuthLogin />
      case 'auth-register': return <AuthRegister />
      case 'auth-otp': return <AuthOTP />
      case 'learning': return <LearningModule />
      case 'quiz': return <QuizModule />
      case 'products': return <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-16"><RefreshCw className="w-8 h-8 animate-spin text-[#48805b]" /></div>}><ProductsCatalog /></Suspense>
      case 'product-learning': return <ProductLearningModule />
      case 'subscriptions': return <SubscriptionView />
      case 'cart': return <CartView />
      case 'checkout': return <CheckoutView />
      case 'order-success': return <OrderSuccess />
      case 'admin-dashboard':
      case 'admin-users':
      case 'admin-campaigns':
      case 'admin-qr':
      case 'admin-orders':
      case 'admin-analytics':
      case 'admin-content':
      case 'admin-products':
      case 'admin-subscriptions':
        return <AdminDashboard />
      case 'profile': return <ProfileView />
      default: return <LandingPage />
    }
  }

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={currentView}
          className={currentView.startsWith('admin') ? 'pt-[88px]' : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.main>
      </AnimatePresence>
    </>
  )
}
