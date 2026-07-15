'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Pause, Play, X, CreditCard, Package, Calendar, Bell, CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { subscriptionService, productService, productLearningService } from '@/lib/data-service'
import type { Subscription, Product, ProductLearningProgress } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// ── Brand Constants ──────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
} as const

// ── Pack Types ───────────────────────────────────────────────
const PACK_TYPES = [
  { value: '30_DAY', label: '30-Day Pack', days: 30, discount: 0 },
  { value: '60_DAY', label: '60-Day Pack', days: 60, discount: 5 },
  { value: '90_DAY', label: '90-Day Pack', days: 90, discount: 10 },
  { value: '180_DAY', label: '180-Day Pack', days: 180, discount: 15 },
  { value: 'CUSTOM', label: 'Custom Pack', days: 30, discount: 0 },
]

// ── Status Badge Config ──────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: 'Active', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PAUSED: { label: 'Paused', bg: 'bg-amber-100', text: 'text-amber-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' },
}

// ── Animation Variants ───────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// ── Helper ───────────────────────────────────────────────────
function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ══════════════════════════════════════════════════════════════
// SubscriptionView
// ══════════════════════════════════════════════════════════════
export function SubscriptionView() {
  const user = useAppStore((s) => s.user)
  const navigateTo = useAppStore((s) => s.navigateTo)

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Fetch subscriptions + products ───────────────────────
  useEffect(() => {
    if (!user?.user_id) return
    let cancelled = false

    async function fetch() {
      setLoading(true)
      try {
        const { data: subs } = await subscriptionService.getByUser(user.user_id)
        if (cancelled) return
        setSubscriptions(subs ?? [])

        // Resolve product names for each subscription
        const { data: allProducts } = await productService.getAll()
        if (cancelled) return
        const map: Record<string, Product> = {}
        ;(allProducts ?? []).forEach((p) => {
          map[p.id] = p
        })
        setProducts(map)
      } catch (err) {
        console.error('Failed to load subscriptions', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [user?.user_id])

  // ── Handlers ─────────────────────────────────────────────
  async function handlePauseResume(sub: Subscription) {
    const newStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setActionLoading(sub.id)
    try {
      const { error } = await subscriptionService.updateStatus(sub.id, newStatus)
      if (error) throw error
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus as Subscription['status'] } : s))
      )
      toast.success(newStatus === 'PAUSED' ? 'Subscription paused' : 'Subscription resumed')
    } catch {
      toast.error('Failed to update subscription')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel(sub: Subscription) {
    setActionLoading(sub.id)
    try {
      const { error } = await subscriptionService.updateStatus(sub.id, 'CANCELLED')
      if (error) throw error
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, status: 'CANCELLED' } : s))
      )
      toast.success('Subscription cancelled')
    } catch {
      toast.error('Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAutoRenewToggle(sub: Subscription, checked: boolean) {
    try {
      const { error } = await subscriptionService.toggleAutoRenew(sub.id, checked)
      if (error) throw error
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, auto_renew: checked } : s))
      )
      toast.success(checked ? 'Auto-renew enabled' : 'Auto-renew disabled')
    } catch {
      toast.error('Failed to toggle auto-renew')
    }
  }

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: BRAND.muted }} />
        <p className="text-sm font-heading" style={{ color: BRAND.muted }}>
          Loading subscriptions…
        </p>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────
  if (subscriptions.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div
          className="rounded-full p-5 mb-5"
          style={{ backgroundColor: BRAND.surface }}
        >
          <Package className="h-10 w-10" style={{ color: BRAND.muted }} />
        </div>
        <h3 className="font-heading text-lg font-semibold mb-2" style={{ color: BRAND.dark }}>
          No subscriptions yet
        </h3>
        <p className="text-sm text-center max-w-xs mb-6" style={{ color: BRAND.muted }}>
          Subscribe to your favourite products and never run out. Enjoy auto-delivery with flexible pack options.
        </p>
        <Button
          onClick={() => navigateTo('products')}
          className="gap-2 text-white font-heading"
          style={{ backgroundColor: BRAND.green }}
        >
          <Zap className="h-4 w-4" />
          Browse Products
        </Button>
      </motion.div>
    )
  }

  // ── Subscription cards ───────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-xl font-bold" style={{ color: BRAND.dark }}>
          My Subscriptions
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-heading"
          style={{ borderColor: BRAND.green, color: BRAND.green }}
          onClick={() => navigateTo('products')}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Subscribe
        </Button>
      </div>

      {subscriptions.map((sub, i) => {
        const product = products[sub.product_id]
        const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.EXPIRED
        const pack = PACK_TYPES.find((p) => p.value === sub.pack_type)
        const isActive = sub.status === 'ACTIVE'
        const isPaused = sub.status === 'PAUSED'
        const isCancelled = sub.status === 'CANCELLED'
        const isExpired = sub.status === 'EXPIRED'
        const busy = actionLoading === sub.id

        return (
          <motion.div
            key={sub.id}
            custom={i}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cardVariants}
          >
            <Card
              className="overflow-hidden border-0 shadow-sm"
              style={{ backgroundColor: BRAND.bg }}
            >
              <CardContent className="p-0">
                {/* Top: product info row */}
                <div className="flex items-start gap-4 p-4 pb-3">
                  {/* Product image / icon */}
                  <div
                    className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: BRAND.surface }}
                  >
                    {product?.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product?.name ?? 'Product'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6" style={{ color: BRAND.muted }} />
                    )}
                  </div>

                  {/* Product name, pack, status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-heading font-semibold truncate" style={{ color: BRAND.dark }}>
                        {product?.name ?? sub.product_id}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`${statusCfg.bg} ${statusCfg.text} text-[10px] px-1.5 py-0 font-heading shrink-0`}
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.muted }}>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {pack?.label ?? sub.pack_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {sub.pack_duration_days} days
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-base" style={{ color: BRAND.dark }}>
                      {formatINR(sub.amount)}
                    </p>
                    <p className="text-[10px]" style={{ color: BRAND.muted }}>
                      per pack
                    </p>
                  </div>
                </div>

                <Separator style={{ backgroundColor: BRAND.surface }} />

                {/* Dates row */}
                <div className="flex items-center justify-between px-4 py-2.5 text-xs" style={{ color: BRAND.muted }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Started {formatDate(sub.start_date)}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1">
                    Expires {formatDate(sub.end_date)}
                  </span>
                </div>

                <Separator style={{ backgroundColor: BRAND.surface }} />

                {/* Auto-renew + Actions */}
                <div className="flex items-center justify-between px-4 py-3">
                  {/* Auto-renew toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`auto-renew-${sub.id}`}
                      checked={sub.auto_renew}
                      onCheckedChange={(checked) => handleAutoRenewToggle(sub, checked)}
                      disabled={isCancelled || isExpired}
                    />
                    <Label
                      htmlFor={`auto-renew-${sub.id}`}
                      className="text-xs font-heading cursor-pointer"
                      style={{ color: BRAND.muted }}
                    >
                      <Bell className="h-3 w-3 inline mr-1" />
                      Auto-renew
                    </Label>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {(isActive || isPaused) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 font-heading"
                        style={{
                          borderColor: isPaused ? BRAND.green : BRAND.blue,
                          color: isPaused ? BRAND.green : BRAND.blue,
                        }}
                        onClick={() => handlePauseResume(sub)}
                        disabled={busy}
                      >
                        {busy ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : isPaused ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          <Pause className="h-3 w-3" />
                        )}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                    )}

                    {(isActive || isPaused) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 font-heading text-red-500 border-red-300 hover:bg-red-50"
                        onClick={() => handleCancel(sub)}
                        disabled={busy}
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}

                    {(isCancelled || isExpired) && (
                      <span className="text-xs italic" style={{ color: BRAND.muted }}>
                        {isCancelled ? 'Subscription cancelled' : 'Subscription expired'}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Small Plus icon (inline to avoid extra import) ──────────
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
// SubscriptionSelector
// ══════════════════════════════════════════════════════════════
interface SubscriptionSelectorProps {
  product: Product
  open: boolean
  onClose: () => void
  onAddToCart: (mode: 'one-time' | 'subscription', packType: string, amount: number, packDays: number, packDiscount: number) => void
}

export function SubscriptionSelector({
  product,
  open,
  onClose,
  onAddToCart,
}: SubscriptionSelectorProps) {
  const [mode, setMode] = useState<'one-time' | 'subscribe'>('subscribe')
  const [selectedPack, setSelectedPack] = useState<string>('30_DAY')
  const [confirming, setConfirming] = useState(false)

  const selectedPackDef = PACK_TYPES.find((p) => p.value === selectedPack) ?? PACK_TYPES[0]
  const discountAmount = product.price * (selectedPackDef.discount / 100)
  const finalPrice = product.price - discountAmount

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Use microtask to avoid cascading render warning
      queueMicrotask(() => {
        setMode('subscribe')
        setSelectedPack('30_DAY')
        setConfirming(false)
      })
    }
  }, [open])

  function handleConfirm() {
    if (mode === 'one-time') {
      onAddToCart('one-time', 'ONE_TIME', product.price, 0, 0)
    } else {
      onAddToCart('subscription', selectedPack, finalPrice, selectedPackDef.days, selectedPackDef.discount)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md border-0 shadow-xl"
        style={{ backgroundColor: BRAND.bg }}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-lg" style={{ color: BRAND.dark }}>
            Choose Your Plan
          </DialogTitle>
        </DialogHeader>

        {/* Product info */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: BRAND.surface }}>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: BRAND.bg }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-5 w-5" style={{ color: BRAND.muted }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-semibold text-sm truncate" style={{ color: BRAND.dark }}>
              {product.name}
            </h4>
            <p className="text-xs" style={{ color: BRAND.muted }}>
              {product.description ?? product.type}
            </p>
          </div>
          <p className="font-heading font-bold shrink-0" style={{ color: BRAND.dark }}>
            {formatINR(product.price)}
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            onClick={() => setMode('one-time')}
            className="relative rounded-xl p-3 text-left transition-all border-2"
            style={{
              borderColor: mode === 'one-time' ? BRAND.green : 'transparent',
              backgroundColor: mode === 'one-time' ? 'rgba(72,128,91,0.08)' : BRAND.surface,
            }}
          >
            <CreditCard className="h-5 w-5 mb-1.5" style={{ color: mode === 'one-time' ? BRAND.green : BRAND.muted }} />
            <p className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
              One-Time
            </p>
            <p className="text-[11px]" style={{ color: BRAND.muted }}>
              Single purchase
            </p>
            {mode === 'one-time' && (
              <CheckCircle className="absolute top-2 right-2 h-4 w-4" style={{ color: BRAND.green }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode('subscribe')}
            className="relative rounded-xl p-3 text-left transition-all border-2"
            style={{
              borderColor: mode === 'subscribe' ? BRAND.green : 'transparent',
              backgroundColor: mode === 'subscribe' ? 'rgba(72,128,91,0.08)' : BRAND.surface,
            }}
          >
            <Zap className="h-5 w-5 mb-1.5" style={{ color: mode === 'subscribe' ? BRAND.green : BRAND.muted }} />
            <p className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
              Subscribe
            </p>
            <p className="text-[11px]" style={{ color: BRAND.muted }}>
              Save up to 15%
            </p>
            {mode === 'subscribe' && (
              <CheckCircle className="absolute top-2 right-2 h-4 w-4" style={{ color: BRAND.green }} />
            )}
          </button>
        </div>

        {/* Pack type selector (only for subscribe mode) */}
        {mode === 'subscribe' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4"
          >
            <Label className="text-xs font-heading mb-2 block" style={{ color: BRAND.muted }}>
              Select Pack Duration
            </Label>
            <Select value={selectedPack} onValueChange={setSelectedPack}>
              <SelectTrigger className="font-heading" style={{ backgroundColor: BRAND.surface, borderColor: BRAND.surface }}>
                <SelectValue placeholder="Choose pack" />
              </SelectTrigger>
              <SelectContent>
                {PACK_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value} className="font-heading">
                    <span className="flex items-center justify-between gap-4 w-full">
                      <span>{pt.label}</span>
                      <span className="text-xs ml-auto" style={{ color: BRAND.muted }}>
                        {pt.discount > 0 ? `${pt.discount}% off` : 'No discount'}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price breakdown */}
            <div className="mt-3 p-3 rounded-xl space-y-1.5" style={{ backgroundColor: BRAND.surface }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: BRAND.muted }}>Base price</span>
                <span style={{ color: BRAND.dark }}>{formatINR(product.price)}</span>
              </div>
              {selectedPackDef.discount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: BRAND.green }}>Discount ({selectedPackDef.discount}%)</span>
                  <span style={{ color: BRAND.green }}>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <Separator style={{ backgroundColor: BRAND.bg }} />
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
                  You pay
                </span>
                <span className="font-heading text-lg font-bold" style={{ color: BRAND.green }}>
                  {formatINR(finalPrice)}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: BRAND.muted }}>
                Duration: {selectedPackDef.days} days &middot; Auto-renews unless cancelled
              </p>
            </div>
          </motion.div>
        )}

        {/* One-time purchase summary */}
        {mode === 'one-time' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 p-3 rounded-xl"
            style={{ backgroundColor: BRAND.surface }}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
                Total
              </span>
              <span className="font-heading text-lg font-bold" style={{ color: BRAND.dark }}>
                {formatINR(product.price)}
              </span>
            </div>
            <p className="text-[10px] mt-1" style={{ color: BRAND.muted }}>
              One-time purchase &middot; No auto-renewal
            </p>
          </motion.div>
        )}

        {/* Footer actions */}
        <DialogFooter className="mt-5 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-heading"
            style={{ borderColor: BRAND.muted, color: BRAND.muted }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="gap-2 text-white font-heading"
            style={{ backgroundColor: BRAND.green }}
          >
            {confirming ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {mode === 'one-time' ? 'Add to Cart' : 'Add Subscription to Cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
