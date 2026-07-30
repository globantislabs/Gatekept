'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  User, Mail, Phone, MapPin, Shield, Edit, LogOut, ArrowLeft,
  CheckCircle, Award, Globe, RefreshCw, Package, Truck, Clock,
  CreditCard, ChevronRight, AlertCircle, Calendar, Pause, Play,
  XCircle, ShoppingBag, Repeat, Eye, Store,
  MapPinned, RotateCcw, ChevronDown,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { userService, productLearningService, productService, orderService, subscriptionService } from '@/lib/data-service'
import type { UserProfile, ProductLearningProgress, Product, Order, Subscription, OrderTracking, OtpPurpose } from '@/lib/data-service'
import { OtpVerifyModal } from '@/components/OtpVerifyModal'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// ─── Brand Constants ──────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

// ─── Status Helpers ──────────────────────────────────────
const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PLACED:        { label: 'Placed',        color: '#88837b', icon: Clock },
  CONFIRMED:     { label: 'Confirmed',     color: BRAND.blue, icon: CheckCircle },
  PROCESSING:    { label: 'Processing',    color: BRAND.lime, icon: Package },
  SHIPPED:       { label: 'Shipped',       color: BRAND.blue, icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: BRAND.lime, icon: Truck },
  DELIVERED:     { label: 'Delivered',     color: BRAND.green, icon: CheckCircle },
  CANCELLED:     { label: 'Cancelled',     color: '#ef4444', icon: XCircle },
}

const SUBSCRIPTION_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE:    { label: 'Active',    color: BRAND.green, icon: Play },
  PAUSED:    { label: 'Paused',    color: BRAND.lime,  icon: Pause },
  CANCELLED: { label: 'Cancelled', color: '#ef4444',    icon: XCircle },
  EXPIRED:   { label: 'Expired',   color: BRAND.muted,  icon: Clock },
}

const PACK_TYPE_LABELS: Record<string, string> = {
  '30_DAY':  '30-Day Pack (5% off)',
  '60_DAY':  '60-Day Pack (8% off)',
  '90_DAY':  '90-Day Pack (12% off)',
  '180_DAY': '180-Day Pack (15% off)',
}

const TRACKING_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

function getInitials(name: string): string {
  return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── StatusIcon ──────────────────────────────────────────
function StatusIcon({ status, className }: { status: string; className?: string }) {
  const config = ORDER_STATUS_CONFIG[status]
  const Icon = config?.icon || Package
  const color = config?.color || BRAND.muted
  return <Icon className={className} style={{ color }} />
}

// ─── Animation ──────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

// ─── OTP Action Gate ────────────────────────────────────
// Tracks what action is pending OTP verification
type OtpAction =
  | { type: 'CANCEL_ORDER'; orderId: string }
  | { type: 'CANCEL_SUB'; subId: string }
  | { type: 'PAUSE_SUB'; subId: string }
  | { type: 'RESUME_SUB'; subId: string }
  | { type: 'MODIFY_ADDRESS'; orderId: string }

function getOtpPurpose(action: OtpAction): OtpPurpose {
  switch (action.type) {
    case 'CANCEL_ORDER': return 'CANCEL_ORDER'
    case 'CANCEL_SUB': return 'CANCEL_SUB'
    case 'PAUSE_SUB': return 'PAUSE_SUB'
    case 'RESUME_SUB': return 'RESUME_SUB'
    case 'MODIFY_ADDRESS': return 'MODIFY_ADDRESS'
  }
}

function getOtpReferenceId(action: OtpAction): string {
  switch (action.type) {
    case 'CANCEL_ORDER': return action.orderId
    case 'CANCEL_SUB': return action.subId
    case 'PAUSE_SUB': return action.subId
    case 'RESUME_SUB': return action.subId
    case 'MODIFY_ADDRESS': return action.orderId
  }
}

function getOtpLabel(action: OtpAction): string {
  switch (action.type) {
    case 'CANCEL_ORDER': return 'Cancel Order'
    case 'CANCEL_SUB': return 'Cancel Subscription'
    case 'PAUSE_SUB': return 'Pause Subscription'
    case 'RESUME_SUB': return 'Resume Subscription'
    case 'MODIFY_ADDRESS': return 'Modify Shipping Address'
  }
}

// ============================================================
// PROFILE PAGE — Tabbed: Profile / Orders / Subscriptions
// ============================================================
export function ProfilePage() {
  const { user, navigateTo, setUser, goBack, addToCart, resetForLogout, products: cachedProducts } = useAppStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [learningProgress, setLearningProgress] = useState<ProductLearningProgress[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [subActionLoading, setSubActionLoading] = useState<string | null>(null)

  // ── OTP gating state ──
  const [otpAction, setOtpAction] = useState<OtpAction | null>(null)
  const [otpModalOpen, setOtpModalOpen] = useState(false)

  // ── Address edit modal state ──
  const [addressEditOpen, setAddressEditOpen] = useState(false)
  const [addressEditOrderId, setAddressEditOrderId] = useState<string | null>(null)
  const [otpVerifiedIdForAddress, setOtpVerifiedIdForAddress] = useState<string | null>(null)

  // ── Fetch all data ──
  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoadingProgress(true)
      setLoadingOrders(true)
      setLoadingSubs(true)

      try {
        const progress = await productLearningService.get(user.id)
        setLearningProgress(Array.isArray(progress) ? progress : [])
        const prods = await productService.list({ active: true })
        setProducts(prods)
      } catch { /* silent */ } finally { setLoadingProgress(false) }

      try {
        const orderList = await orderService.list(user.id)
        setOrders(orderList)
      } catch { /* silent */ } finally { setLoadingOrders(false) }

      try {
        const subList = await subscriptionService.list(user.id)
        setSubscriptions(subList)
      } catch { /* silent */ } finally { setLoadingSubs(false) }
    }
    fetchData()
  }, [user])

  // ── All hooks must be called before any conditional return ──

  // ── OTP gate trigger ──
  const triggerOtp = (action: OtpAction) => {
    setOtpAction(action)
    setOtpModalOpen(true)
  }

  // ── OTP verified callback — executes the gated action ──
  const onOtpVerified = useCallback(async (otpVerifiedId: string) => {
    if (!otpAction || !user) return

    try {
      switch (otpAction.type) {
        case 'CANCEL_ORDER': {
          setSubActionLoading(otpAction.orderId)
          const updated = await orderService.cancel(otpAction.orderId, otpVerifiedId)
          setOrders(prev => prev.map(o => o.id === otpAction.orderId ? updated : o))
          toast.success('Order cancelled successfully')
          break
        }
        case 'PAUSE_SUB': {
          setSubActionLoading(otpAction.subId)
          const updated = await subscriptionService.pause(otpAction.subId, otpVerifiedId)
          setSubscriptions(prev => prev.map(s => s.id === otpAction.subId ? updated : s))
          toast.success('Subscription paused')
          break
        }
        case 'RESUME_SUB': {
          setSubActionLoading(otpAction.subId)
          const updated = await subscriptionService.resume(otpAction.subId, otpVerifiedId)
          setSubscriptions(prev => prev.map(s => s.id === otpAction.subId ? updated : s))
          toast.success('Subscription resumed')
          break
        }
        case 'CANCEL_SUB': {
          setSubActionLoading(otpAction.subId)
          const updated = await subscriptionService.cancel(otpAction.subId, otpVerifiedId)
          setSubscriptions(prev => prev.map(s => s.id === otpAction.subId ? updated : s))
          toast.success('Subscription cancelled')
          break
        }
        case 'MODIFY_ADDRESS': {
          // OTP verified — open the address edit modal
          setOtpVerifiedIdForAddress(otpVerifiedId)
          setAddressEditOrderId(otpAction.orderId)
          setAddressEditOpen(true)
          break
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed. Please try again.')
    } finally {
      setSubActionLoading(null)
      setOtpAction(null)
    }
  }, [otpAction, user])

  // ── Re-order handler ──
  const handleReorder = (order: Order) => {
    if (!order.items) return
    order.items.forEach(item => {
      addToCart({
        productId: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
        type: item.product_type,
        purchaseType: item.pack_type ? 'subscription' : 'one-time',
        packType: item.pack_type || undefined,
        packDays: item.pack_days || undefined,
        packDiscount: item.pack_discount || undefined,
      })
    })
    toast.success(`${order.items.length} item(s) added to cart!`)
    navigateTo('cart')
  }

  // ── Find order for address edit ──
  const orderForAddressEdit = addressEditOrderId ? orders.find(o => o.id === addressEditOrderId) : null

  const getProductById = (productId: string) => products.find(p => p.id === productId)

  const handleLogout = () => {
    // First, call resetForLogout to clear all Zustand state in memory
    resetForLogout()

    // Then clear localStorage directly — this ensures the persist middleware
    // can't re-save the old state before the page reloads
    try {
      localStorage.removeItem('notjust-app-store')
    } catch { /* ignore */ }

    // Force full page reload to clear all in-memory state and reset to landing
    window.location.href = '/'
  }

  // ── Early return after all hooks ──
  if (!user) {
    // Don't redirect to login — the logout handler will navigate to landing
    // If user becomes null for any other reason, redirect to landing
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-6 h-6 text-[#48805b]" />
          </div>
          <p className="text-[#88837b] text-sm">Logging out...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col">

      {/* ── Main Content ── */}
      <main className="flex-1 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4 mt-6">
              <h1 className="font-heading text-2xl font-bold text-[#1f1e1c]">My Account</h1>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 text-white bg-[#1f1e1c] border-[#1f1e1c] hover:bg-[#2a2926] hover:border-[#2a2926] hover:text-white min-h-[44px] font-heading font-semibold rounded-xl shadow-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-[#e3dfd8]/50 rounded-xl h-12 mb-6">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-[#48805b] data-[state=active]:text-white font-heading font-semibold text-sm min-h-[44px]">
                  <User className="w-4 h-4 mr-1.5" /> Profile
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-[#48805b] data-[state=active]:text-white font-heading font-semibold text-sm min-h-[44px]">
                  <ShoppingBag className="w-4 h-4 mr-1.5" /> Orders
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="rounded-lg data-[state=active]:bg-[#48805b] data-[state=active]:text-white font-heading font-semibold text-sm min-h-[44px]">
                  <Repeat className="w-4 h-4 mr-1.5" /> Subscriptions
                </TabsTrigger>
              </TabsList>

              {/* ═══════════════════════════════════════════════════════
                  PROFILE TAB
                  ═══════════════════════════════════════════════════════ */}
              <TabsContent value="profile">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* ─── User Info Card ─── */}
                  <Card className="border-[#e3dfd8] md:col-span-1">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center mb-6">
                        <Avatar className="w-20 h-20 mb-3">
                          <AvatarFallback className="bg-[#48805b] text-white text-2xl font-bold font-heading">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h2 className="font-bold text-xl text-[#1f1e1c] text-center">{user.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          {user.is_admin && <Badge className="bg-[#2e91b2]/10 text-[#2e91b2] border-[#2e91b2]/20"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
                          {user.learning_completed && <Badge className="bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20"><CheckCircle className="w-3 h-3 mr-1" />Learning Complete</Badge>}
                        </div>
                      </div>
                      <Separator className="bg-[#e3dfd8] mb-4" />
                      <div className="space-y-3">
                        {user.email && <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">Email:</span><span className="text-[#1f1e1c] font-medium">{user.email}</span></div>}
                        {user.phone && <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">Phone:</span><span className="text-[#1f1e1c] font-medium">{user.phone}</span></div>}
                        {user.age && <div className="flex items-center gap-3 text-sm"><User className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">Age:</span><span className="text-[#1f1e1c] font-medium">{user.age}</span></div>}
                        {user.gender && <div className="flex items-center gap-3 text-sm"><User className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">Gender:</span><span className="text-[#1f1e1c] font-medium">{user.gender}</span></div>}
                        {user.country && <div className="flex items-center gap-3 text-sm"><Globe className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">Country:</span><span className="text-[#1f1e1c] font-medium">{user.country}</span></div>}
                        {user.state && <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-[#48805b]" /><span className="text-[#88837b]">State:</span><span className="text-[#1f1e1c] font-medium">{user.state}</span></div>}
                      </div>
                      <Separator className="bg-[#e3dfd8] mt-4 mb-4" />
                      <EditProfileButton user={user} setUser={setUser} editOpen={editOpen} setEditOpen={setEditOpen} />
                    </CardContent>
                  </Card>

                  {/* ─── Learning + Account ─── */}
                  <div className="md:col-span-2 space-y-6">
                    <Card className="border-[#e3dfd8]">
                      <CardHeader className="pb-3"><CardTitle className="text-base font-heading font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#48805b]" />Learning Progress</CardTitle></CardHeader>
                      <CardContent>
                        {loadingProgress ? (
                          <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-[#48805b]" /><span className="ml-2 text-sm text-[#88837b]">Loading...</span></div>
                        ) : learningProgress.length === 0 ? (
                          <div className="text-center py-8"><Award className="w-10 h-10 text-[#e3dfd8] mx-auto mb-3" /><p className="text-sm text-[#88837b]">No learning progress yet.</p><Button onClick={() => navigateTo('products')} variant="outline" className="mt-3 border-[#48805b] text-[#48805b] min-h-[44px]">Start Learning</Button></div>
                        ) : (
                          <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {learningProgress.map(lp => {
                              const product = getProductById(lp.product_id)
                              return (
                                <div key={lp.id} className="p-4 rounded-xl bg-[#f4f3f0] border border-[#e3dfd8]">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-[#1f1e1c]">{product?.name || 'Unknown Product'}</span>
                                    <Badge className={lp.status === 'COMPLETED' ? 'bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20' : lp.status === 'IN_PROGRESS' ? 'bg-[#2e91b2]/10 text-[#2e91b2] border-[#2e91b2]/20' : 'bg-[#e3dfd8] text-[#88837b]'}>{lp.status === 'COMPLETED' ? 'Completed' : lp.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}</Badge>
                                  </div>
                                  {lp.video_progress && Object.keys(lp.video_progress).length > 0 && (
                                    <div className="space-y-2 mb-2">{Object.entries(lp.video_progress).map(([vidId, prog]) => (
                                      <div key={vidId} className="flex items-center gap-2"><span className="text-xs text-[#88837b] w-24 truncate">Video {vidId.slice(-3)}</span><Progress value={prog} className="flex-1 h-2 bg-[#e3dfd8]" /><span className="text-xs text-[#88837b] w-8 text-right">{prog}%</span></div>
                                    ))}</div>
                                  )}
                                  {lp.quiz_completed && <div className="flex items-center gap-2 mt-2"><CheckCircle className="w-4 h-4 text-[#48805b]" /><span className="text-sm text-[#1f1e1c]">Quiz Score: <strong>{lp.quiz_score}%</strong></span>{lp.quiz_score >= 80 && <Badge className="bg-[#afb75d]/10 text-[#afb75d] border-[#afb75d]/20 text-xs"><Award className="w-3 h-3 mr-1" />Passed</Badge>}</div>}
                                  {lp.completed_at && <p className="text-xs text-[#88837b] mt-2">Completed on {formatDate(lp.completed_at)}</p>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-[#e3dfd8]">
                      <CardHeader className="pb-3"><CardTitle className="text-base font-heading font-bold flex items-center gap-2"><User className="w-5 h-5 text-[#48805b]" />Account Details</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { label: 'User ID', value: user.user_id, icon: <User className="w-4 h-4" /> },
                            { label: 'Email', value: user.email || 'Not provided', icon: <Mail className="w-4 h-4" /> },
                            { label: 'Phone', value: user.phone || 'Not provided', icon: <Phone className="w-4 h-4" /> },
                            { label: 'Joined', value: formatDate(user.created_at), icon: <Calendar className="w-4 h-4" /> },
                            { label: 'Admin', value: user.is_admin ? 'Yes' : 'No', icon: <Shield className="w-4 h-4" /> },
                          ].map(item => (
                            <DetailItem key={item.label} {...item} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════
                  ORDERS TAB
                  ═══════════════════════════════════════════════════════ */}
              <TabsContent value="orders">
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-[#48805b]" /><span className="ml-2 text-sm text-[#88837b]">Loading orders...</span></div>
                ) : orders.length === 0 ? (
                  <Card className="border-[#e3dfd8]">
                    <CardContent className="py-16 text-center">
                      <ShoppingBag className="w-12 h-12 text-[#e3dfd8] mx-auto mb-4" />
                      <h3 className="font-heading text-lg font-bold text-[#1f1e1c] mb-2">No orders yet</h3>
                      <p className="text-sm text-[#88837b] mb-4">Start your wellness journey by placing your first order.</p>
                      <Button onClick={() => navigateTo('products')} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading min-h-[44px]">
                        <Store className="w-4 h-4 mr-2" /> Browse Products
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {orders.map(order => (
                      <Card key={order.id} className="border-[#e3dfd8] overflow-hidden">
                        {/* ── Order Header ── */}
                        <CardContent className="p-0">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-[#f4f3f0]/50 transition-colors min-h-[44px]"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#48805b]/10">
                                <StatusIcon status={order.status} className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-heading font-bold text-sm text-[#1f1e1c]">{order.order_number}</p>
                                <p className="text-xs text-[#88837b]">{formatDate(order.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${ORDER_STATUS_CONFIG[order.status]?.color === BRAND.green ? 'bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20' : ORDER_STATUS_CONFIG[order.status]?.color === '#ef4444' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#e3dfd8] text-[#88837b]'} text-xs font-semibold`}>
                                {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                              </Badge>
                              <p className="font-heading font-bold text-[#1f1e1c]">₹{order.total_amount.toLocaleString()}</p>
                              <ChevronRight className={`w-4 h-4 text-[#88837b] transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
                            </div>
                          </button>

                          {/* ── Expanded Details ── */}
                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 sm:px-5 pb-5 border-t border-[#e3dfd8]">
                                  {/* ── Items ── */}
                                  <div className="mt-4">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#88837b] mb-3">Order Items</h4>
                                    <div className="space-y-2">
                                      {order.items?.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-[#f4f3f0]">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-[#1f1e1c] flex items-center justify-center text-[#afb75d] text-xs font-bold">{item.product_type === 'STILL' ? 'S' : 'F'}</div>
                                            <div>
                                              <p className="text-sm font-medium text-[#1f1e1c]">{item.product_name}</p>
                                              {item.pack_type && <p className="text-xs text-[#48805b]">{PACK_TYPE_LABELS[item.pack_type] || item.pack_type}</p>}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm font-semibold text-[#1f1e1c]">₹{item.total_price.toLocaleString()}</p>
                                            <p className="text-xs text-[#88837b]">Qty: {item.quantity}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* ── Amount Breakdown ── */}
                                  <div className="mt-4 p-3 rounded-lg bg-[#f4f3f0]">
                                    <div className="space-y-1.5 text-sm">
                                      <div className="flex justify-between"><span className="text-[#88837b]">Subtotal</span><span className="text-[#1f1e1c]">₹{order.subtotal.toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span className="text-[#88837b]">Tax (GST)</span><span className="text-[#1f1e1c]">₹{order.tax_amount.toLocaleString()}</span></div>
                                      {order.discount_amount > 0 && <div className="flex justify-between"><span className="text-[#48805b]">Discount</span><span className="text-[#48805b]">-₹{order.discount_amount.toLocaleString()}</span></div>}
                                      <Separator className="bg-[#e3dfd8]" />
                                      <div className="flex justify-between font-bold"><span className="text-[#1f1e1c]">Total</span><span className="text-[#1f1e1c]">₹{order.total_amount.toLocaleString()}</span></div>
                                    </div>
                                  </div>

                                  {/* ── Shipping ── */}
                                  {order.shipping_address && (
                                    <div className="mt-4">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#88837b] mb-2">Shipping Address</h4>
                                      <div className="p-3 rounded-lg bg-[#f4f3f0] text-sm text-[#1f1e1c]">
                                        <p className="font-medium">{order.shipping_name}</p>
                                        <p>{order.shipping_address}</p>
                                        <p>{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
                                        {order.shipping_phone && <p className="text-[#88837b]">Phone: {order.shipping_phone}</p>}
                                      </div>
                                      {/* ── Edit Address button for PLACED/CONFIRMED ── */}
                                      {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                                        <Button
                                          onClick={() => triggerOtp({ type: 'MODIFY_ADDRESS', orderId: order.id })}
                                          variant="outline"
                                          className="mt-2 border-[#48805b] text-[#48805b] hover:bg-[#48805b]/5 min-h-[44px] flex items-center gap-2"
                                        >
                                          <MapPinned className="w-4 h-4" /> Edit Address
                                        </Button>
                                      )}
                                    </div>
                                  )}

                                  {/* ── Payment ── */}
                                  <div className="mt-4 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="w-4 h-4 text-[#88837b]" />
                                      <span className="text-xs text-[#88837b]">Payment:</span>
                                      <Badge className={order.payment_status === 'COMPLETED' ? 'bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20' : 'bg-[#e3dfd8] text-[#88837b]'}>{order.payment_status} · {order.payment_method || 'UPI'}</Badge>
                                    </div>
                                  </div>

                                  {/* ── Enhanced Tracking: Progress Bar + Vertical Timeline ── */}
                                  {order.tracking && order.tracking.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#88837b] mb-3">
                                        <Truck className="w-3 h-3 mr-1 inline" /> Delivery Tracking
                                      </h4>
                                      <EnhancedTrackingTimeline tracking={order.tracking} currentStatus={order.status} />
                                    </div>
                                  )}

                                  {/* ── Actions ── */}
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {/* Cancel order for PLACED/CONFIRMED/PENDING */}
                                    {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                                      <Button
                                        onClick={() => triggerOtp({ type: 'CANCEL_ORDER', orderId: order.id })}
                                        variant="outline"
                                        className="border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] flex items-center gap-2"
                                        disabled={subActionLoading === order.id}
                                      >
                                        {subActionLoading === order.id
                                          ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                          : <XCircle className="w-4 h-4 mr-2" />}
                                        Cancel Order
                                      </Button>
                                    )}

                                    {/* Re-order for DELIVERED orders */}
                                    {order.status === 'DELIVERED' && (
                                      <Button
                                        onClick={() => handleReorder(order)}
                                        className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px] flex items-center gap-2"
                                      >
                                        <RotateCcw className="w-4 h-4" /> Re-order
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════
                  SUBSCRIPTIONS TAB
                  ═══════════════════════════════════════════════════════ */}
              <TabsContent value="subscriptions">
                {loadingSubs ? (
                  <div className="flex items-center justify-center py-20"><RefreshCw className="w-6 h-6 animate-spin text-[#48805b]" /><span className="ml-2 text-sm text-[#88837b]">Loading subscriptions...</span></div>
                ) : subscriptions.length === 0 ? (
                  <Card className="border-[#e3dfd8]">
                    <CardContent className="py-16 text-center">
                      <Repeat className="w-12 h-12 text-[#e3dfd8] mx-auto mb-4" />
                      <h3 className="font-heading text-lg font-bold text-[#1f1e1c] mb-2">No subscriptions yet</h3>
                      <p className="text-sm text-[#88837b] mb-4">Subscribe to regular deliveries and save more.</p>
                      <Button onClick={() => navigateTo('products')} className="bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading min-h-[44px]">
                        <Store className="w-4 h-4 mr-2" /> Browse Products
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {subscriptions.map(sub => {
                      const statusConfig = SUBSCRIPTION_STATUS_CONFIG[sub.status] || { label: sub.status, color: BRAND.muted, icon: Clock }
                      const isActionLoading = subActionLoading === sub.id
                      return (
                        <Card key={sub.id} className="border-[#e3dfd8] overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1f1e1c]">
                                  <span className="text-[#afb75d] text-xs font-bold">{sub.product_type === 'STILL' ? 'S' : 'F'}</span>
                                </div>
                                <div>
                                  <p className="font-heading font-bold text-sm text-[#1f1e1c]">{sub.product_name}</p>
                                  <p className="text-xs text-[#48805b]">{PACK_TYPE_LABELS[sub.pack_type] || sub.pack_type}</p>
                                </div>
                              </div>
                              <Badge className={`${statusConfig.color === BRAND.green ? 'bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20' : statusConfig.color === '#ef4444' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#e3dfd8] text-[#88837b]'} text-xs font-semibold`}>
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg bg-[#f4f3f0]">
                                <p className="text-xs text-[#88837b]">Price</p>
                                <p className="text-sm font-bold text-[#1f1e1c]">₹{sub.unit_price.toLocaleString()}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[#f4f3f0]">
                                <p className="text-xs text-[#88837b]">Frequency</p>
                                <p className="text-sm font-bold text-[#1f1e1c]">Every {sub.frequency_days} days</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[#f4f3f0]">
                                <p className="text-xs text-[#88837b]">Cycles</p>
                                <p className="text-sm font-bold text-[#1f1e1c]">{sub.completed_cycles}/{sub.total_cycles}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-[#f4f3f0]">
                                <p className="text-xs text-[#88837b]">Next Delivery</p>
                                <p className="text-sm font-bold text-[#1f1e1c]">{formatDate(sub.next_delivery)}</p>
                              </div>
                            </div>

                            {/* ── Delivery Schedule Timeline ── */}
                            {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                              <div className="mt-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#88837b] mb-2 flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" /> Delivery Schedule
                                </h4>
                                <DeliveryScheduleTimeline subscription={sub} />
                              </div>
                            )}

                            {/* ── Dates ── */}
                            <div className="mt-3 flex items-center gap-4 text-xs text-[#88837b]">
                              <span>Started: {formatDate(sub.start_date)}</span>
                              {sub.end_date && <span>Ends: {formatDate(sub.end_date)}</span>}
                              {sub.paused_at && <span>Paused: {formatDate(sub.paused_at)}</span>}
                              {sub.cancelled_at && <span>Cancelled: {formatDate(sub.cancelled_at)}</span>}
                            </div>

                            {/* ── OTP-gated Actions ── */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {sub.status === 'ACTIVE' && (
                                <Button
                                  onClick={() => triggerOtp({ type: 'PAUSE_SUB', subId: sub.id })}
                                  disabled={isActionLoading}
                                  variant="outline"
                                  className="border-[#e3dfd8] text-[#88837b] hover:text-[#1f1e1c] min-h-[44px] flex items-center gap-2"
                                >
                                  {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                                  Pause
                                </Button>
                              )}
                              {sub.status === 'PAUSED' && (
                                <Button
                                  onClick={() => triggerOtp({ type: 'RESUME_SUB', subId: sub.id })}
                                  disabled={isActionLoading}
                                  className="bg-[#48805b] hover:bg-[#3a6a4a] text-white min-h-[44px] flex items-center gap-2"
                                >
                                  {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                  Resume
                                </Button>
                              )}
                              {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                                <Button
                                  onClick={() => triggerOtp({ type: 'CANCEL_SUB', subId: sub.id })}
                                  disabled={isActionLoading}
                                  variant="outline"
                                  className="border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4 mr-2" /> Cancel
                                </Button>
                              )}
                              {sub.status === 'CANCELLED' && (
                                <Badge className="bg-red-50 text-red-600 border-red-200">Subscription ended</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#1f1e1c] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Image src="/images/notjust-logo-clean.png" alt="NotJust" width={100} height={32} className="h-8 w-auto object-contain" />
            <p className="text-white/30 text-xs">© 2025 NOTJUST HEALTH™</p>
          </div>
        </div>
      </footer>

      {/* ── OTP Verification Modal ── */}
      {otpAction && user && (
        <OtpVerifyModal
          open={otpModalOpen}
          onOpenChange={setOtpModalOpen}
          userId={user.id}
          purpose={getOtpPurpose(otpAction)}
          referenceId={getOtpReferenceId(otpAction)}
          purposeLabel={getOtpLabel(otpAction)}
          onVerified={onOtpVerified}
        />
      )}

      {/* ── Address Edit Modal ── */}
      {addressEditOpen && orderForAddressEdit && otpVerifiedIdForAddress && (
        <AddressEditModal
          open={addressEditOpen}
          onOpenChange={(open) => {
            setAddressEditOpen(open)
            if (!open) {
              setOtpVerifiedIdForAddress(null)
              setAddressEditOrderId(null)
            }
          }}
          order={orderForAddressEdit}
          otpVerifiedId={otpVerifiedIdForAddress}
          onUpdate={(updatedOrder) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
            setAddressEditOpen(false)
            setOtpVerifiedIdForAddress(null)
            setAddressEditOrderId(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Detail Item ──────────────────────────────────────────
function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const isNotProvided = value === 'Not provided'
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#f4f3f0]/50 border border-[#e3dfd8]/50">
      <div className="text-[#48805b] mt-0.5">{icon}</div>
      <div><p className="text-xs text-[#88837b] font-medium">{label}</p><p className={`text-sm font-medium ${isNotProvided ? 'text-[#88837b]' : 'text-[#1f1e1c]'}`}>{value}</p></div>
    </div>
  )
}

// ─── Enhanced Tracking Timeline ──────────────────────────
// Horizontal progress bar + vertical timeline
function EnhancedTrackingTimeline({ tracking, currentStatus }: { tracking: OrderTracking[]; currentStatus: string }) {
  const currentStepIndex = TRACKING_STEPS.indexOf(currentStatus)
  const isCancelled = currentStatus === 'CANCELLED'
  const progressPercent = isCancelled
    ? 0
    : currentStepIndex >= 0
      ? Math.round(((currentStepIndex + 1) / TRACKING_STEPS.length) * 100)
      : 0

  const sortedTracking = [...tracking].sort((a, b) => new Date(a.tracked_at).getTime() - new Date(b.tracked_at).getTime())

  return (
    <div className="space-y-4">
      {/* ── Horizontal Progress Bar ── */}
      <div className="relative">
        {/* Background bar with step markers */}
        <div className="relative h-2 rounded-full bg-[#e3dfd8] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-0 top-0 h-full rounded-full bg-[#48805b]"
          />
        </div>

        {/* Step markers */}
        <div className="flex justify-between mt-1">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex && currentStepIndex >= 0 && !isCancelled
            const isCurrent = step === currentStatus && !isCancelled
            const stepConfig = ORDER_STATUS_CONFIG[step]
            return (
              <div key={step} className="flex flex-col items-center" style={{ width: `${100 / TRACKING_STEPS.length}%` }}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isCompleted ? 'bg-[#48805b] border-[#48805b]' :
                  isCurrent ? 'bg-[#afb75d] border-[#afb75d]' :
                  'bg-white border-[#e3dfd8]'
                }`}>
                  {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                  {isCurrent && !isCompleted && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  isCompleted ? 'text-[#48805b]' :
                  isCurrent ? 'text-[#afb75d]' :
                  'text-[#88837b]'
                }`}>
                  {stepConfig?.label || step}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Vertical Timeline ── */}
      <div className="relative pl-6 border-l-2 border-[#e3dfd8] ml-[9px]">
        {sortedTracking.map((step, idx) => {
          const stepIndex = TRACKING_STEPS.indexOf(step.status)
          const isCompleted = stepIndex <= currentStepIndex && currentStepIndex >= 0 && !isCancelled
          const isCurrent = step.status === currentStatus && !isCancelled

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="relative pb-4 last:pb-0"
            >
              {/* Timeline dot */}
              <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 ${
                isCompleted ? 'bg-[#48805b] border-[#48805b]' :
                isCurrent ? 'bg-[#afb75d] border-[#afb75d]' :
                'bg-white border-[#e3dfd8]'
              }`} />

              <div className="ml-2">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${
                    isCompleted ? 'text-[#48805b]' :
                    isCurrent ? 'text-[#afb75d]' :
                    'text-[#88837b]'
                  }`}>
                    {ORDER_STATUS_CONFIG[step.status]?.label || step.status}
                  </p>
                  {isCurrent && (
                    <Badge className="bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs animate-pulse">Current</Badge>
                  )}
                </div>
                {step.description && <p className="text-xs text-[#88837b] mt-0.5">{step.description}</p>}
                {step.location && <p className="text-xs text-[#88837b] flex items-center gap-1"><MapPin className="w-3 h-3" />{step.location}</p>}
                <p className="text-xs text-[#88837b] mt-0.5">{formatDateTime(step.tracked_at)}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Delivery Schedule Timeline ──────────────────────────
// Shows past, current, and future deliveries for a subscription
function DeliveryScheduleTimeline({ subscription }: { subscription: Subscription }) {
  const { start_date, frequency_days, completed_cycles, total_cycles, next_delivery, status } = subscription

  // Generate delivery dates
  const startDate = new Date(start_date)
  const deliveries: { date: Date; cycle: number; type: 'past' | 'next' | 'future' }[] = []

  for (let cycle = 1; cycle <= total_cycles; cycle++) {
    const deliveryDate = new Date(startDate.getTime() + (cycle - 1) * frequency_days * 24 * 60 * 60 * 1000)
    const type = cycle <= completed_cycles ? 'past' : cycle === completed_cycles + 1 ? 'next' : 'future'
    deliveries.push({ date: deliveryDate, cycle, type })
  }

  // Show max 3 past, 1 next, 3 future
  const pastDeliveries = deliveries.filter(d => d.type === 'past').slice(-3)
  const nextDelivery = deliveries.find(d => d.type === 'next')
  const futureDeliveries = deliveries.filter(d => d.type === 'future').slice(0, 3)

  const displayItems = [...pastDeliveries, nextDelivery, ...futureDeliveries].filter(Boolean)

  return (
    <div className="p-4 rounded-xl bg-[#f4f3f0] border border-[#e3dfd8]">
      {/* ── Cycle progress bar ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#88837b]">Delivery Progress</span>
          <span className="text-xs font-semibold text-[#1f1e1c]">{completed_cycles}/{total_cycles} cycles</span>
        </div>
        <Progress
          value={(completed_cycles / total_cycles) * 100}
          className="h-2 bg-[#e3dfd8]"
        />
      </div>

      {/* ── Timeline entries ── */}
      <div className="space-y-2">
        {displayItems.map((item, idx) => {
          const isNext = item.type === 'next'
          const isPast = item.type === 'past'
          const isFuture = item.type === 'future'
          const isPaused = status === 'PAUSED' && (isNext || isFuture)

          return (
            <motion.div
              key={`${item.cycle}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg ${
                isNext ? 'bg-[#48805b]/10 border border-[#48805b]/20' :
                isFuture ? 'bg-[#f4f3f0]' :
                'bg-[#e3dfd8]/30'
              }`}
            >
              {/* Icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isPast ? 'bg-[#48805b] text-white' :
                isNext ? 'bg-[#afb75d] text-white' :
                'bg-[#e3dfd8] text-[#88837b]'
              }`}>
                {isPast ? <CheckCircle className="w-3.5 h-3.5" /> :
                 isNext ? <Truck className="w-3.5 h-3.5" /> :
                 <Calendar className="w-3.5 h-3.5" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    isNext ? 'text-[#48805b]' :
                    isPast ? 'text-[#1f1e1c]' :
                    'text-[#88837b]'
                  }`}>
                    Cycle #{item.cycle}
                  </span>
                  {isNext && !isPaused && (
                    <Badge className="bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs">Next</Badge>
                  )}
                  {isPaused && (
                    <Badge className="bg-[#afb75d]/10 text-[#afb75d] border-[#afb75d]/20 text-xs">Paused</Badge>
                  )}
                  {isPast && (
                    <Badge className="bg-[#48805b]/10 text-[#48805b] border-[#48805b]/20 text-xs">Delivered</Badge>
                  )}
                </div>
                <p className={`text-xs ${isPast ? 'text-[#88837b]' : isNext ? 'text-[#1f1e1c]' : 'text-[#88837b]'}`}>
                  {formatDate(item.date.toISOString())}
                </p>
              </div>

              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                isPast ? 'bg-[#48805b]' :
                isNext ? 'bg-[#afb75d] animate-pulse' :
                'bg-[#e3dfd8]'
              }`} />
            </motion.div>
          )
        })}
      </div>

      {total_cycles > 7 && (
        <p className="text-xs text-[#88837b] mt-2 text-center">
          Showing {displayItems.length} of {total_cycles} scheduled deliveries
        </p>
      )}
    </div>
  )
}

// ─── Address Edit Modal ──────────────────────────────────
// Dialog on desktop, Sheet on mobile
function AddressEditModal({
  open,
  onOpenChange,
  order,
  otpVerifiedId,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  otpVerifiedId: string
  onUpdate: (updatedOrder: Order) => void
}) {
  const [form, setForm] = useState({
    shipping_name: order.shipping_name || '',
    shipping_phone: order.shipping_phone || '',
    shipping_address: order.shipping_address || '',
    shipping_city: order.shipping_city || '',
    shipping_state: order.shipping_state || '',
    shipping_pincode: order.shipping_pincode || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        shipping_name: order.shipping_name || '',
        shipping_phone: order.shipping_phone || '',
        shipping_address: order.shipping_address || '',
        shipping_city: order.shipping_city || '',
        shipping_state: order.shipping_state || '',
        shipping_pincode: order.shipping_pincode || '',
      })
      setError(null)
    }
  }, [open, order])

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSave = async () => {
    setError(null)
    // Validation
    if (!form.shipping_name.trim()) { setError('Name is required'); return }
    if (!form.shipping_address.trim()) { setError('Address is required'); return }
    if (!form.shipping_city.trim()) { setError('City is required'); return }
    if (!form.shipping_state.trim()) { setError('State is required'); return }
    if (!form.shipping_pincode.trim()) { setError('Pincode is required'); return }
    if (!/^\d{6}$/.test(form.shipping_pincode.trim())) { setError('Pincode must be 6 digits'); return }

    setLoading(true)
    try {
      const updated = await orderService.updateAddress(order.id, {
        shipping_name: form.shipping_name.trim(),
        shipping_phone: form.shipping_phone.trim(),
        shipping_address: form.shipping_address.trim(),
        shipping_city: form.shipping_city.trim(),
        shipping_state: form.shipping_state.trim(),
        shipping_pincode: form.shipping_pincode.trim(),
      }, otpVerifiedId)
      onUpdate(updated)
      toast.success('Shipping address updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update address')
      toast.error('Failed to update address')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Verified badge */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#48805b]/10 border border-[#48805b]/20">
        <Shield className="w-4 h-4 text-[#48805b]" />
        <span className="text-xs text-[#48805b] font-semibold">OTP Verified — You can now modify the address</span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Full Name <span className="text-[#48805b]">*</span></Label>
        <Input value={form.shipping_name} onChange={e => updateField('shipping_name', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Phone</Label>
        <Input type="tel" value={form.shipping_phone} onChange={e => updateField('shipping_phone', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Address <span className="text-[#48805b]">*</span></Label>
        <Input value={form.shipping_address} onChange={e => updateField('shipping_address', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">City <span className="text-[#48805b]">*</span></Label>
        <Input value={form.shipping_city} onChange={e => updateField('shipping_city', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">State <span className="text-[#48805b]">*</span></Label>
        <Select value={form.shipping_state} onValueChange={v => updateField('shipping_state', v)}>
          <SelectTrigger className="h-11 border-[#e3dfd8] w-full"><SelectValue placeholder="Select state" /></SelectTrigger>
          <SelectContent className="max-h-48">{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Pincode <span className="text-[#48805b]">*</span></Label>
        <Input type="text" maxLength={6} value={form.shipping_pincode} onChange={e => updateField('shipping_pincode', e.target.value.replace(/\D/g, ''))} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px]">
          {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : 'Save Address'}
        </Button>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 h-11 border-[#e3dfd8] text-[#88837b] min-h-[44px]">Cancel</Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md border-[#e3dfd8] max-h-[85vh] overflow-y-auto hidden md:block">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-[#48805b]" /> Edit Shipping Address
            </DialogTitle>
            <DialogDescription className="text-[#88837b]">
              Order {order.order_number} — Update delivery address
            </DialogDescription>
          </DialogHeader>
          <Separator className="bg-[#e3dfd8]" />
          {modalContent}
        </DialogContent>
      </Dialog>

      {/* Mobile: Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] md:hidden rounded-t-2xl border-[#e3dfd8] overflow-y-auto">
          <SheetHeader className="px-6 pt-4 pb-2">
            <SheetTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-[#48805b]" /> Edit Shipping Address
            </SheetTitle>
            <SheetDescription className="text-[#88837b]">
              Order {order.order_number} — Update delivery address
            </SheetDescription>
          </SheetHeader>
          <Separator className="bg-[#e3dfd8]" />
          <div className="px-6 pt-4 pb-6">{modalContent}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ─── Edit Profile ─────────────────────────────────────────
function EditProfileButton({ user, setUser, editOpen, setEditOpen }: { user: UserProfile; setUser: (u: UserProfile | null) => void; editOpen: boolean; setEditOpen: (o: boolean) => void }) {
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', phone: user.phone || '', age: user.age ? String(user.age) : '', gender: user.gender || '', state: user.state || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (editOpen) { setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', age: user.age ? String(user.age) : '', gender: user.gender || '', state: user.state || '' }); setError(null) } }, [editOpen, user])

  const updateField = (field: string, value: string) => { setForm(prev => ({ ...prev, [field]: value })); setError(null) }

  const handleSave = async () => {
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          age: form.age ? parseInt(form.age) : null,
          gender: form.gender || null,
          state: form.state || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }
      const data = await res.json()
      if (data.user) setUser(data.user as UserProfile)
      setEditOpen(false)
      toast.success('Profile updated successfully!')
    } catch (err: any) { setError(err.message || 'Failed to update profile.') } finally { setLoading(false) }
  }

  const editFormContent = (
    <div className="space-y-4">
      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
      <div className="space-y-2"><Label className="text-sm font-medium">Full Name <span className="text-[#48805b]">*</span></Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" autoComplete="off" /></div>
      <div className="space-y-2"><Label className="text-sm font-medium">Email</Label><Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" autoComplete="off" /></div>
      <div className="space-y-2"><Label className="text-sm font-medium">Phone</Label><Input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" autoComplete="off" /></div>
      <div className="space-y-2"><Label className="text-sm font-medium">Age</Label><Input type="number" value={form.age} onChange={e => updateField('age', e.target.value)} className="h-11 border-[#e3dfd8] focus:border-[#48805b]" min={1} max={120} autoComplete="off" /></div>
      <div className="space-y-2"><Label className="text-sm font-medium">Gender</Label><Select value={form.gender} onValueChange={v => updateField('gender', v)}><SelectTrigger className="h-11 border-[#e3dfd8] w-full"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label className="text-sm font-medium">State</Label><Select value={form.state} onValueChange={v => updateField('state', v)}><SelectTrigger className="h-11 border-[#e3dfd8] w-full"><SelectValue placeholder="Select your state" /></SelectTrigger><SelectContent className="max-h-48">{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px]">{loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : 'Save Changes'}</Button>
        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading} className="flex-1 h-11 border-[#e3dfd8] text-[#88837b] min-h-[44px]">Cancel</Button>
      </div>
    </div>
  )

  return (
    <>
      <Button onClick={() => setEditOpen(true)} className="w-full h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px] flex items-center gap-2"><Edit className="w-4 h-4" />Edit Profile</Button>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md border-[#e3dfd8] max-h-[85vh] overflow-y-auto hidden md:block">
          <DialogHeader><DialogTitle className="font-heading text-lg font-bold flex items-center gap-2"><Edit className="w-5 h-5 text-[#48805b]" />Edit Profile</DialogTitle><DialogDescription className="text-[#88837b]">Update your personal information</DialogDescription></DialogHeader>
          <Separator className="bg-[#e3dfd8]" />
          {editFormContent}
        </DialogContent>
      </Dialog>
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="h-[90vh] md:hidden rounded-t-2xl border-[#e3dfd8] overflow-y-auto">
          <SheetHeader className="px-6 pt-4 pb-2"><SheetTitle className="font-heading text-lg font-bold flex items-center gap-2"><Edit className="w-5 h-5 text-[#48805b]" />Edit Profile</SheetTitle><SheetDescription className="text-[#88837b]">Update your personal information</SheetDescription></SheetHeader>
          <Separator className="bg-[#e3dfd8]" />
          <div className="px-6 pt-4 pb-6">{editFormContent}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}
