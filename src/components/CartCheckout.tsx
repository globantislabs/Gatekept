'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  MapPin, Phone, CreditCard, Landmark, Smartphone, CheckCircle,
  Package, Truck, ShieldCheck, ChevronRight, X, Loader2,
  ShoppingCart, Sparkles, Leaf, Banknote, Mail, Repeat, Calendar, Download
} from 'lucide-react'
import { useAppStore, type CartItem, getCartItemKey } from '@/store/app-store'
import ProductImage from '@/components/ProductImage'
import SiteFooter from '@/components/SiteFooter'
import { orderService } from '@/lib/data-service'
import type { Order } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

// ─── BRAND CONSTANTS ────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
}

// ─── ANIMATION VARIANTS ─────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
}

// ─── Indian States ──────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
]

// ─── Payment Method Options ─────────────────────────────────
type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'COD'

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'COD', label: 'Cash on Delivery', icon: <Banknote className="w-5 h-5" />, description: 'Pay when your order arrives at your doorstep' },
  { value: 'UPI', label: 'UPI', icon: <Smartphone className="w-5 h-5" />, description: 'Pay via Google Pay, PhonePe, Paytm' },
  { value: 'CARD', label: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" />, description: 'Visa, Mastercard, RuPay' },
  { value: 'NET_BANKING', label: 'Net Banking', icon: <Landmark className="w-5 h-5" />, description: 'All major banks supported' },
]

// ─── Subscription Pack Options ──────────────────────────────
type PurchaseMode = 'one-time' | 'subscription'
type SubscriptionPack = '30_DAY' | '60_DAY' | '90_DAY' | '180_DAY'

const SUBSCRIPTION_PACKS: { value: SubscriptionPack; label: string; days: number; discount: number; frequency: string }[] = [
  { value: '30_DAY', label: '30 Day Pack', days: 30, discount: 5, frequency: 'Monthly' },
  { value: '60_DAY', label: '60 Day Pack', days: 60, discount: 10, frequency: 'Bi-monthly' },
  { value: '90_DAY', label: '90 Day Pack', days: 90, discount: 15, frequency: 'Quarterly' },
  { value: '180_DAY', label: '180 Day Pack', days: 180, discount: 20, frequency: 'Half-yearly' },
]

// ═══════════════════════════════════════════════════════════
// CartView — Shopping cart display
// ═══════════════════════════════════════════════════════════
export function CartView() {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, navigateTo, goBack } = useAppStore()
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const total = cartTotal()
  const isEmpty = cart.length === 0

  const handleRemove = (productId: string) => {
    setRemovingIds(prev => new Set(prev).add(productId))
    setTimeout(() => {
      removeFromCart(productId)
      setRemovingIds(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }, 300)
  }

  // ─── Empty Cart State ──────────────────────────────────────
  if (isEmpty) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#f4f3f0]"
      >
        <motion.div variants={fadeInUp} className="text-center max-w-md">
          {/* Decorative icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#e3dfd8] flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[#88837b]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1f1e1c] mb-2">Your cart is empty</h2>
          <p className="text-[#88837b] mb-8 text-base">
            Looks like you haven&apos;t added any wellness shots yet. Start shopping to fill it up!
          </p>
          <Button
            onClick={() => navigateTo('products')}
            className="bg-[#48805b] hover:bg-[#48805b]/90 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-md transition-all hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Browse Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => goBack()}
            className="mt-4 text-[#88837b] hover:text-[#1f1e1c]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  // ─── Cart with Items ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e3dfd8]"
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goBack()}
            className="text-[#1f1e1c] hover:bg-[#e3dfd8] rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-lg sm:text-xl font-bold text-[#1f1e1c] flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-5 h-5 text-[#48805b]" />
            <span className="truncate">Shopping Cart</span>
          </h1>
          <Badge className="ml-auto bg-[#48805b] text-white text-xs font-semibold">
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </motion.div>

      {/* Items List */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 pb-40 space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {cart.map((item) => (
            <CartItemCard
              key={item.cartKey || getCartItemKey(item)}
              item={item}
              isRemoving={removingIds.has(item.cartKey || getCartItemKey(item))}
              onQuantityChange={(qty) => updateCartQuantity(item.cartKey || getCartItemKey(item), qty)}
              onRemove={() => handleRemove(item.cartKey || getCartItemKey(item))}
            />
          ))}
        </AnimatePresence>

        {/* Continue Shopping */}
        <motion.div variants={fadeInUp} className="pt-2">
          <Button
            onClick={() => navigateTo('products')}
            className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white rounded-lg py-2.5 font-semibold shadow-md transition-all hover:shadow-lg"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Keep Shopping
          </Button>
        </motion.div>
      </motion.div>

      {/* Sticky Footer with Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } }}
        className="sticky bottom-0 z-30 bg-white border-t border-[#e3dfd8] shadow-lg shadow-[#e3dfd8]/30"
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Price breakdown */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm text-[#88837b]">
              <span>Subtotal ({cart.length} {cart.length === 1 ? 'product' : 'products'})</span>
              <span>&#8377;{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm text-[#88837b]">
              <span>Taxes & fees</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <Separator className="mb-3 bg-[#e3dfd8]" />
          <div className="flex justify-between items-center gap-4 mb-4">
            <span className="font-heading text-lg font-bold text-[#1f1e1c]">Estimated Total</span>
            <span className="font-heading text-xl sm:text-2xl font-bold text-[#48805b] whitespace-nowrap">&#8377;{total.toLocaleString('en-IN')}</span>
          </div>
          <Button
            onClick={() => navigateTo('checkout')}
            className="w-full bg-[#48805b] hover:bg-[#48805b]/90 text-white py-3.5 rounded-lg font-semibold text-base shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
      <SiteFooter />
    </div>
  )
}

// ─── Cart Item Card ─────────────────────────────────────────
function CartItemCard({
  item,
  isRemoving,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem
  isRemoving: boolean
  onQuantityChange: (qty: number) => void
  onRemove: () => void
}) {
  const itemTotal = item.price * item.quantity
  const packInfo = item.packType ? `${item.packType}${item.packDays ? ` · ${item.packDays} days` : ''}` : null

  return (
    <motion.div
      layout
      variants={itemVariant}
      exit={{ opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.3 } }}
      className={isRemoving ? 'opacity-30 scale-95' : ''}
    >
      <Card className="bg-white border-[#e3dfd8] shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col min-[430px]:flex-row gap-0 min-[430px]:gap-3 sm:gap-4">
            {/* Product Image */}
            <div className="w-full h-44 min-[430px]:w-24 min-[430px]:h-28 sm:w-28 sm:h-28 flex-shrink-0 bg-[#e3dfd8] min-[430px]:rounded-l-lg overflow-hidden relative">
              {item.imageUrl ? (
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-[#88837b]" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0 p-3 min-[430px]:py-3 min-[430px]:pl-0 min-[430px]:pr-2 sm:py-4 sm:pr-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold text-[#1f1e1c] text-sm sm:text-base truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.type && (
                      <Badge variant="secondary" className="bg-[#e3dfd8] text-[#88837b] text-xs px-2 py-0.5">
                        {item.type}
                      </Badge>
                    )}
                    {item.purchaseType === 'subscription' && (
                      <Badge className="bg-[#afb75d]/20 text-[#48805b] text-xs px-2 py-0.5 border-[#afb75d]/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Subscription
                      </Badge>
                    )}
                  </div>
                  {packInfo && (
                    <p className="text-xs text-[#88837b] mt-1">{packInfo}</p>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="text-[#88837b] hover:text-red-500 hover:bg-red-50 rounded-full h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Price & Quantity Row */}
              <div className="flex flex-col min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between gap-3 mt-3">
                <div className="text-sm sm:text-base">
                  <span className="font-semibold text-[#1f1e1c]">&#8377;{item.price.toLocaleString('en-IN')}</span>
                  {item.packDiscount && (
                    <span className="text-xs text-[#48805b] ml-1.5">
                      {item.packDiscount}% off
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-[#f4f3f0] rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuantityChange(item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="h-7 w-7 rounded-md hover:bg-[#e3dfd8] text-[#1f1e1c] disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-sm text-[#1f1e1c]">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onQuantityChange(item.quantity + 1)}
                    className="h-7 w-7 rounded-md hover:bg-[#e3dfd8] text-[#1f1e1c]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Item Total */}
              <div className="text-left min-[430px]:text-right mt-1">
                <span className="font-heading font-bold text-[#48805b] text-sm sm:text-base">
                  &#8377;{itemTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// CheckoutView — Order creation / checkout flow
// ═══════════════════════════════════════════════════════════
export function CheckoutView() {
  const {
    user, cart, cartTotal, clearCart, navigateTo, goBack,
    setLastOrderId, setLastOrderNumber, setLastPaymentMethod, setRedirectAfterLogin, setUser
  } = useAppStore()

  // ── Billing Form State (PRIMARY contact for WhatsApp / email) ──
  const [billingName, setBillingName] = useState(user?.name || '')
  const [billingPhone, setBillingPhone] = useState(user?.phone || '')
  const [billingEmail, setBillingEmail] = useState(user?.email || '')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState(user?.state || '')
  const [billingPincode, setBillingPincode] = useState('')

  // ── Shipping Form State (used only when !sameAsBilling) ──
  const [shippingName, setShippingName] = useState(user?.name || '')
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '')
  const [shippingEmail, setShippingEmail] = useState(user?.email || '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingState, setShippingState] = useState(user?.state || '')
  const [shippingPincode, setShippingPincode] = useState('')

  // ── Same as billing flag (default true) ──
  const [sameAsBilling, setSameAsBilling] = useState(true)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [placing, setPlacing] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Subscription State ──
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('one-time')
  const [selectedPack, setSelectedPack] = useState<SubscriptionPack>('30_DAY')
  // Product-specific subscription plans (parsed from product.subscription_plans JSON)
  const [productSubPlans, setProductSubPlans] = useState<Array<{cycle: number, price: number, label: string}>>([])
  const [selectedSubPlanIdx, setSelectedSubPlanIdx] = useState(0)

  // Fetch product subscription plans when subscription mode is selected
  useEffect(() => {
    if (purchaseMode !== 'subscription' || cart.length === 0) return
    const firstItem = cart[0]
    fetch(`/api/products/${firstItem.productId}`)
      .then(res => res.json())
      .then(data => {
        const product = data.product || data
        try {
          const plans = JSON.parse(product.subscription_plans || '[]')
          if (Array.isArray(plans) && plans.length > 0) {
            setProductSubPlans(plans)
            setSelectedSubPlanIdx(0)
          }
        } catch { /* no plans */ }
      })
      .catch(() => {})
  }, [purchaseMode, cart])

  // ── Derived ──
  const subtotal = cartTotal()
  const taxAmount = Math.round(subtotal * 0.18)
  const subPack = SUBSCRIPTION_PACKS.find(p => p.value === selectedPack)
  // For product-specific plans, use the plan's price directly
  const selectedSubPlan = productSubPlans[selectedSubPlanIdx] || null
  const subscriptionDiscount = purchaseMode === 'subscription' && subPack && productSubPlans.length === 0
    ? Math.round(subtotal * (subPack.discount / 100))
    : 0
  // When using product-specific plans, the subscription price replaces the cart price
  const subscriptionSubtotal = purchaseMode === 'subscription' && selectedSubPlan
    ? selectedSubPlan.price * cart.reduce((sum, item) => sum + item.quantity, 0)
    : subtotal
  const discountAmount = cart.reduce((sum, item) => sum + ((item.packDiscount || 0) / 100) * item.price * item.quantity, 0) + subscriptionDiscount
  const totalAmount = (purchaseMode === 'subscription' && selectedSubPlan ? subscriptionSubtotal : subtotal) + taxAmount - discountAmount
  const isEmpty = cart.length === 0

  // ── Auth Guard ──
  useEffect(() => {
    if (!user) {
      setRedirectAfterLogin('checkout')
      navigateTo('auth-login')
      return
    }
  }, [user, navigateTo, setRedirectAfterLogin])

  // ── Validate form ──
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // ── Billing validation (always required — primary contact) ──
    if (!billingName.trim()) errors.billingName = 'Name is required'
    if (!billingPhone.trim()) errors.billingPhone = 'Phone is required'
    else if (!/^[\d]{10}$/.test(billingPhone.trim())) errors.billingPhone = 'Enter a valid 10-digit phone number'
    if (!billingEmail.trim()) errors.billingEmail = 'Email is required for order confirmation'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim())) errors.billingEmail = 'Enter a valid email address'
    if (!billingAddress.trim()) errors.billingAddress = 'Address is required'
    if (!billingCity.trim()) errors.billingCity = 'City is required'
    if (!billingState) errors.billingState = 'State is required'
    if (!billingPincode.trim()) errors.billingPincode = 'Pincode is required'
    else if (!/^[\d]{6}$/.test(billingPincode.trim())) errors.billingPincode = 'Enter a valid 6-digit pincode'

    // ── Shipping validation (only when shipping differs from billing) ──
    if (!sameAsBilling) {
      if (!shippingName.trim()) errors.shippingName = 'Name is required'
      if (!shippingPhone.trim()) errors.shippingPhone = 'Phone is required'
      else if (!/^[\d]{10}$/.test(shippingPhone.trim())) errors.shippingPhone = 'Enter a valid 10-digit phone number'
      if (!shippingEmail.trim()) errors.shippingEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingEmail.trim())) errors.shippingEmail = 'Enter a valid email address'
      if (!shippingAddress.trim()) errors.shippingAddress = 'Address is required'
      if (!shippingCity.trim()) errors.shippingCity = 'City is required'
      if (!shippingState) errors.shippingState = 'State is required'
      if (!shippingPincode.trim()) errors.shippingPincode = 'Pincode is required'
      else if (!/^[\d]{6}$/.test(shippingPincode.trim())) errors.shippingPincode = 'Enter a valid 6-digit pincode'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Place Order ──
  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    if (!user) {
      setRedirectAfterLogin('checkout')
      navigateTo('auth-login')
      return
    }

    setPlacing(true)

    try {
      const totalAmount = cartTotal() * (purchaseMode === 'subscription' && subPack ? (1 - subPack.discount / 100) : 1)

      // Resolve shipping fields — when sameAsBilling, copy billing → shipping
      const finalShippingName = sameAsBilling ? billingName.trim() : shippingName.trim()
      const finalShippingPhone = sameAsBilling ? billingPhone.trim() : shippingPhone.trim()
      const finalShippingEmail = sameAsBilling ? billingEmail.trim() : shippingEmail.trim()
      const finalShippingAddress = sameAsBilling ? billingAddress.trim() : shippingAddress.trim()
      const finalShippingCity = sameAsBilling ? billingCity.trim() : shippingCity.trim()
      const finalShippingState = sameAsBilling ? billingState : shippingState
      const finalShippingPincode = sameAsBilling ? billingPincode.trim() : shippingPincode.trim()

      const orderData = {
        user_id: user.id,
        items: cart.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          product_type: item.type || 'FIZZ',
          quantity: item.quantity,
          // When using product-specific subscription plan, use the plan's price
          unit_price: purchaseMode === 'subscription' && selectedSubPlan ? selectedSubPlan.price : item.price,
          total_price: purchaseMode === 'subscription' && selectedSubPlan ? selectedSubPlan.price * item.quantity : item.price * item.quantity,
          pack_type: purchaseMode === 'subscription' ? (selectedSubPlan ? (selectedSubPlan.label || `${selectedSubPlan.cycle}_DAY`) : selectedPack) : (item.packType || null),
          pack_days: purchaseMode === 'subscription' ? (selectedSubPlan ? selectedSubPlan.cycle : subPack?.days) : (item.packDays || null),
          pack_discount: purchaseMode === 'subscription' ? (selectedSubPlan ? 0 : subPack?.discount) : (item.packDiscount || null),
        })),
        // ── Billing address (primary contact) ──
        billing_name: billingName.trim(),
        billing_phone: billingPhone.trim(),
        billing_email: billingEmail.trim(),
        billing_address: billingAddress.trim(),
        billing_city: billingCity.trim(),
        billing_state: billingState,
        billing_pincode: billingPincode.trim(),
        // ── Shipping address (auto-copied from billing when same_as_billing) ──
        shipping_name: finalShippingName,
        shipping_phone: finalShippingPhone,
        shipping_email: finalShippingEmail,
        shipping_address: finalShippingAddress,
        shipping_city: finalShippingCity,
        shipping_state: finalShippingState,
        shipping_pincode: finalShippingPincode,
        same_as_billing: sameAsBilling,
        payment_method: paymentMethod,
        purchase_mode: purchaseMode,
      }

      const order = await orderService.create(orderData)

      // Success — update local user state with billing email if it was missing from profile
      if (user && billingEmail.trim() && !user.email) {
        setUser({ ...user, email: billingEmail.trim() })
      }

      setLastOrderId(order.id)
      setLastOrderNumber(order.order_number || order.id)
      setLastPaymentMethod(paymentMethod)

      // ── COD: Go directly to success ──
      if (paymentMethod === 'COD') {
        clearCart()
        toast.success('Order placed successfully! 🎉', {
          description: `Order #${order.order_number || order.id}`,
          duration: 5000,
        })
        navigateTo('order-success')
        return
      }

      // ── Online Payment (UPI/CARD/NET_BANKING): Initiate PhonePe ──
      try {
        const redirectUrl = `${window.location.origin}?payment=return&orderNumber=${order.order_number || order.id}`

        const paymentRes = await fetch('/api/payments/phonepe/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantOrderId: order.order_number || order.id,
            amount: order.total_amount,
            redirectUrl,
          }),
        })

        const paymentData = await paymentRes.json()

        if (paymentData.success && paymentData.paymentUrl) {
          // Clear cart before redirect (user will return to success page)
          clearCart()
          toast.success('Redirecting to payment...', { duration: 3000 })
          // Redirect to PhonePe payment page
          window.location.href = paymentData.paymentUrl
        } else {
          // Payment initiation failed — still keep order as PENDING
          toast.error('Payment initiation failed', {
            description: paymentData.error || 'Could not connect to payment gateway. Your order is saved — retry payment from My Orders.',
            duration: 6000,
          })
          clearCart()
          navigateTo('order-success')
        }
      } catch (paymentErr: any) {
        // Payment initiation network error — order is saved as PENDING
        console.error('[Checkout] PhonePe initiation error:', paymentErr)
        toast.error('Payment gateway error', {
          description: 'Your order is saved. Please retry payment from My Orders.',
          duration: 6000,
        })
        clearCart()
        navigateTo('order-success')
      }
    } catch (err: any) {
      toast.error('Failed to place order', {
        description: err.message || 'Something went wrong. Please try again.',
        duration: 4000,
      })
    } finally {
      setPlacing(false)
    }
  }

  // ── Empty Cart Guard ──
  if (isEmpty) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#f4f3f0]"
      >
        <motion.div variants={fadeInUp} className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#e3dfd8] flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[#88837b]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1f1e1c] mb-2">Nothing to checkout</h2>
          <p className="text-[#88837b] mb-8 text-base">
            Your cart is empty. Add some wellness shots before checking out.
          </p>
          <Button
            onClick={() => navigateTo('products')}
            className="bg-[#48805b] hover:bg-[#48805b]/90 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-md"
          >
            <Leaf className="w-4 h-4 mr-2" />
            Browse Products
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  // ── Not logged in guard ──
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f3f0] flex items-center justify-center">
        <div className="animate-pulse text-[#48805b] font-heading text-xl">Redirecting to login...</div>
      </div>
    )
  }

  // ─── Main Checkout Layout ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e3dfd8]"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo('cart')}
            className="text-[#1f1e1c] hover:bg-[#e3dfd8] rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold text-[#1f1e1c] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#48805b]" />
            Checkout
          </h1>
          <div className="ml-auto flex items-center gap-2 text-xs text-[#88837b]">
            <LockStep active={1} total={3} current={2} />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 lg:grid lg:grid-cols-5 lg:gap-6"
      >
        {/* Left Column — Billing / Shipping / Payment */}
        <div className="lg:col-span-3 space-y-5 mb-6 lg:mb-0">
          {/* ─── Billing Address ─── */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-white border-[#e3dfd8] shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg text-[#1f1e1c] flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#48805b]" />
                  Billing Address
                </CardTitle>
                <CardDescription className="text-[#88837b] text-sm">
                  Primary contact for invoice, order confirmation &amp; WhatsApp updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="billing-name" className="text-sm font-medium text-[#1f1e1c]">
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="billing-name"
                    value={billingName}
                    onChange={e => setBillingName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingName ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {formErrors.billingName && <p className="text-xs text-red-500">{formErrors.billingName}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="billing-phone" className="text-sm font-medium text-[#1f1e1c]">
                    Phone Number <span className="text-red-400">*</span>
                    <span className="text-[#88837b] font-normal ml-1">(for WhatsApp updates)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#88837b] font-medium bg-[#f4f3f0] px-2.5 py-1.5 rounded-lg border border-[#e3dfd8]">+91</span>
                    <Input
                      id="billing-phone"
                      value={billingPhone}
                      onChange={e => setBillingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingPhone ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                  </div>
                  {formErrors.billingPhone && <p className="text-xs text-red-500">{formErrors.billingPhone}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="billing-email" className="text-sm font-medium text-[#1f1e1c]">
                    Email <span className="text-red-400">*</span>
                    <span className="text-[#88837b] font-normal ml-1">(for order confirmation &amp; invoice)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#88837b] shrink-0" />
                    <Input
                      id="billing-email"
                      type="email"
                      value={billingEmail}
                      onChange={e => setBillingEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingEmail ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                  </div>
                  {formErrors.billingEmail && <p className="text-xs text-red-500">{formErrors.billingEmail}</p>}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="billing-address" className="text-sm font-medium text-[#1f1e1c]">
                    Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="billing-address"
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    placeholder="House/flat no., street, area"
                    className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingAddress ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {formErrors.billingAddress && <p className="text-xs text-red-500">{formErrors.billingAddress}</p>}
                </div>

                {/* City, State, Pincode Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label htmlFor="billing-city" className="text-sm font-medium text-[#1f1e1c]">
                      City <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="billing-city"
                      value={billingCity}
                      onChange={e => setBillingCity(e.target.value)}
                      placeholder="City"
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingCity ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {formErrors.billingCity && <p className="text-xs text-red-500">{formErrors.billingCity}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1f1e1c]">
                      State <span className="text-red-400">*</span>
                    </Label>
                    <Select value={billingState} onValueChange={setBillingState}>
                      <SelectTrigger className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] rounded-lg w-full ${formErrors.billingState ? 'border-red-400' : ''}`}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e3dfd8] rounded-lg max-h-[240px]">
                        {INDIAN_STATES.map(state => (
                          <SelectItem key={state} value={state} className="text-sm text-[#1f1e1c]">
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.billingState && <p className="text-xs text-red-500">{formErrors.billingState}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="billing-pincode" className="text-sm font-medium text-[#1f1e1c]">
                      Pincode <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="billing-pincode"
                      value={billingPincode}
                      onChange={e => setBillingPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      maxLength={6}
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.billingPincode ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {formErrors.billingPincode && <p className="text-xs text-red-500">{formErrors.billingPincode}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Same as Billing Checkbox ─── */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-start gap-3 p-4 bg-white border border-[#e3dfd8] rounded-xl shadow-sm">
              <Checkbox
                id="same-as-billing"
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
                className="border-[#48805b] data-[state=checked]:bg-[#48805b] data-[state=checked]:text-white data-[state=checked]:border-[#48805b] mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="same-as-billing" className="text-sm font-medium text-[#1f1e1c] cursor-pointer">
                  Use billing address as shipping address
                </Label>
                <p className="text-xs text-[#88837b]">
                  {sameAsBilling
                    ? 'Your order will be delivered to the billing address above.'
                    : 'Enter a different shipping address below for delivery.'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Shipping Address (only shown when !sameAsBilling) ─── */}
          {!sameAsBilling && (
            <motion.div
              variants={fadeInUp}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-white border-[#e3dfd8] shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-lg text-[#1f1e1c] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#48805b]" />
                    Shipping Address
                  </CardTitle>
                  <CardDescription className="text-[#88837b] text-sm">
                    Where should we deliver your wellness shots?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-name" className="text-sm font-medium text-[#1f1e1c]">
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="shipping-name"
                      value={shippingName}
                      onChange={e => setShippingName(e.target.value)}
                      placeholder="Recipient's full name"
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingName ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {formErrors.shippingName && <p className="text-xs text-red-500">{formErrors.shippingName}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-phone" className="text-sm font-medium text-[#1f1e1c]">
                      Phone Number <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#88837b] font-medium bg-[#f4f3f0] px-2.5 py-1.5 rounded-lg border border-[#e3dfd8]">+91</span>
                      <Input
                        id="shipping-phone"
                        value={shippingPhone}
                        onChange={e => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingPhone ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {formErrors.shippingPhone && <p className="text-xs text-red-500">{formErrors.shippingPhone}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-email" className="text-sm font-medium text-[#1f1e1c]">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#88837b] shrink-0" />
                      <Input
                        id="shipping-email"
                        type="email"
                        value={shippingEmail}
                        onChange={e => setShippingEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingEmail ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                    </div>
                    {formErrors.shippingEmail && <p className="text-xs text-red-500">{formErrors.shippingEmail}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-address" className="text-sm font-medium text-[#1f1e1c]">
                      Address <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="shipping-address"
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="House/flat no., street, area"
                      className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingAddress ? 'border-red-400 focus:border-red-400' : ''}`}
                    />
                    {formErrors.shippingAddress && <p className="text-xs text-red-500">{formErrors.shippingAddress}</p>}
                  </div>

                  {/* City, State, Pincode Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="shipping-city" className="text-sm font-medium text-[#1f1e1c]">
                        City <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="shipping-city"
                        value={shippingCity}
                        onChange={e => setShippingCity(e.target.value)}
                        placeholder="City"
                        className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingCity ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                      {formErrors.shippingCity && <p className="text-xs text-red-500">{formErrors.shippingCity}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-[#1f1e1c]">
                        State <span className="text-red-400">*</span>
                      </Label>
                      <Select value={shippingState} onValueChange={setShippingState}>
                        <SelectTrigger className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] rounded-lg w-full ${formErrors.shippingState ? 'border-red-400' : ''}`}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#e3dfd8] rounded-lg max-h-[240px]">
                          {INDIAN_STATES.map(state => (
                            <SelectItem key={state} value={state} className="text-sm text-[#1f1e1c]">
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.shippingState && <p className="text-xs text-red-500">{formErrors.shippingState}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="shipping-pincode" className="text-sm font-medium text-[#1f1e1c]">
                        Pincode <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="shipping-pincode"
                        value={shippingPincode}
                        onChange={e => setShippingPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        maxLength={6}
                        className={`bg-[#f4f3f0] border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 rounded-lg ${formErrors.shippingPincode ? 'border-red-400 focus:border-red-400' : ''}`}
                      />
                      {formErrors.shippingPincode && <p className="text-xs text-red-500">{formErrors.shippingPincode}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Purchase Mode — One-time vs Subscription */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-white border-[#e3dfd8] shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg text-[#1f1e1c] flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-[#48805b]" />
                  Purchase Option
                </CardTitle>
                <CardDescription className="text-[#88837b] text-sm">
                  Choose one-time purchase or subscribe & save
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* One-time */}
                  <button
                    type="button"
                    onClick={() => setPurchaseMode('one-time')}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      purchaseMode === 'one-time'
                        ? 'border-[#48805b] bg-[#48805b]/5 shadow-sm'
                        : 'border-[#e3dfd8] bg-[#f4f3f0] hover:border-[#48805b]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className={`w-4 h-4 ${purchaseMode === 'one-time' ? 'text-[#48805b]' : 'text-[#88837b]'}`} />
                      <span className="font-semibold text-sm text-[#1f1e1c]">One-time</span>
                    </div>
                    <p className="text-xs text-[#88837b]">Single purchase, no commitment</p>
                    {purchaseMode === 'one-time' && (
                      <CheckCircle className="w-4 h-4 text-[#48805b] absolute top-2 right-2" />
                    )}
                  </button>

                  {/* Subscription */}
                  <button
                    type="button"
                    onClick={() => setPurchaseMode('subscription')}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                      purchaseMode === 'subscription'
                        ? 'border-[#48805b] bg-[#48805b]/5 shadow-sm'
                        : 'border-[#e3dfd8] bg-[#f4f3f0] hover:border-[#48805b]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Repeat className={`w-4 h-4 ${purchaseMode === 'subscription' ? 'text-[#48805b]' : 'text-[#88837b]'}`} />
                      <span className="font-semibold text-sm text-[#1f1e1c]">Subscribe</span>
                      <Badge className="bg-[#afb75d]/20 text-[#48805b] text-[10px] px-1.5 py-0 border-[#afb75d]/30">
                        Save up to 20%
                      </Badge>
                    </div>
                    <p className="text-xs text-[#88837b]">Auto-delivery, cancel anytime</p>
                    {purchaseMode === 'subscription' && (
                      <CheckCircle className="w-4 h-4 text-[#48805b] absolute top-2 right-2" />
                    )}
                  </button>
                </div>

                {/* Subscription Pack Selector */}
                {purchaseMode === 'subscription' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-xs font-medium text-[#88837b] uppercase tracking-wider">Select Subscription Cycle</p>
                    {productSubPlans.length > 0 ? (
                      /* Product-specific subscription plans */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {productSubPlans.map((plan, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSubPlanIdx(idx)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              selectedSubPlanIdx === idx
                                ? 'border-[#48805b] bg-[#48805b]/8'
                                : 'border-[#e3dfd8] bg-[#f4f3f0] hover:border-[#48805b]/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm text-[#1f1e1c]">{plan.label || `${plan.cycle} days`}</p>
                              <p className="font-bold text-sm text-[#48805b]">₹{plan.price.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3 text-[#88837b]" />
                              <p className="text-[10px] text-[#88837b]">Every {plan.cycle} days · ₹{Math.round(plan.price / plan.cycle)}/day</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Fallback: hardcoded packs (when product has no custom plans) */
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SUBSCRIPTION_PACKS.map(pack => (
                          <button
                            key={pack.value}
                            type="button"
                            onClick={() => setSelectedPack(pack.value)}
                            className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                              selectedPack === pack.value
                                ? 'border-[#48805b] bg-[#48805b]/8'
                                : 'border-[#e3dfd8] bg-[#f4f3f0] hover:border-[#48805b]/30'
                            }`}
                          >
                            <p className="font-semibold text-sm text-[#1f1e1c]">{pack.label}</p>
                            <p className="text-xs text-[#48805b] font-medium mt-0.5">{pack.discount}% off</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Calendar className="w-3 h-3 text-[#88837b]" />
                              <p className="text-[10px] text-[#88837b]">{pack.frequency}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedSubPlan && (
                      <div className="p-2.5 bg-[#48805b]/10 border border-[#48805b]/20 rounded-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#48805b] flex-shrink-0" />
                        <p className="text-xs text-[#48805b]">
                          <strong>{selectedSubPlan.label || `${selectedSubPlan.cycle} days`}</strong> subscription · ₹{selectedSubPlan.price.toLocaleString('en-IN')} per cycle · delivered every {selectedSubPlan.cycle} days.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Method */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-white border-[#e3dfd8] shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg text-[#1f1e1c] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#48805b]" />
                  Payment Method
                </CardTitle>
                <CardDescription className="text-[#88837b] text-sm">
                  Select your preferred payment option
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  className="space-y-3"
                >
                  {PAYMENT_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === option.value
                          ? 'border-[#48805b] bg-[#48805b]/5 shadow-sm'
                          : 'border-[#e3dfd8] bg-[#f4f3f0] hover:border-[#48805b]/30'
                      }`}
                    >
                      <RadioGroupItem
                        value={option.value}
                        className="border-[#48805b] text-[#48805b]"
                      />
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === option.value
                            ? 'bg-[#48805b]/10 text-[#48805b]'
                            : 'bg-[#e3dfd8] text-[#88837b]'
                        }`}>
                          {option.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#1f1e1c]">{option.label}</p>
                          <p className="text-xs text-[#88837b]">{option.description}</p>
                        </div>
                      </div>
                      {paymentMethod === option.value && (
                        <CheckCircle className="w-5 h-5 text-[#48805b] ml-auto flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </RadioGroup>

                {/* COD Info */}
                {paymentMethod === 'COD' && (
                  <div className="mt-4 p-3 bg-[#48805b]/10 border border-[#48805b]/20 rounded-lg">
                    <p className="text-xs text-[#48805b] flex items-center gap-1.5 font-medium">
                      <Banknote className="w-3.5 h-3.5" />
                      Cash on Delivery — Pay ₹{totalAmount.toLocaleString('en-IN')} when your order arrives.
                    </p>
                    <p className="text-xs text-[#88837b] mt-1 ml-5">A small COD handling fee may apply. Please keep exact change ready.</p>
                  </div>
                )}

                {/* Online Payment Note */}
                {paymentMethod !== 'COD' && (
                  <div className="mt-4 p-3 bg-[#48805b]/10 border border-[#48805b]/20 rounded-lg">
                    <p className="text-xs text-[#48805b] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#48805b]" />
                      Secure payment powered by PhonePe. You&apos;ll be redirected to complete payment after placing your order.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column — Order Summary */}
        <div className="lg:col-span-2">
          <motion.div variants={scaleIn}>
            <Card className="bg-white border-[#e3dfd8] shadow-sm rounded-xl lg:sticky lg:top-16">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg text-[#1f1e1c] flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#48805b]" />
                  Order Summary
                </CardTitle>
                <CardDescription className="text-[#88837b] text-sm">
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Items List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.cartKey || getCartItemKey(item)} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#e3dfd8] overflow-hidden flex-shrink-0 relative">
                        {item.imageUrl ? (
                          <ProductImage src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-[#88837b]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1f1e1c] truncate">{item.name}</p>
                        <p className="text-xs text-[#88837b]">
                          Qty: {item.quantity}
                          {item.packType && ` · ${item.packType}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#1f1e1c] flex-shrink-0">
                        &#8377;{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4 bg-[#e3dfd8]" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88837b]">Subtotal</span>
                    <span className="text-[#1f1e1c]">&#8377;{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88837b]">GST (18%)</span>
                    <span className="text-[#1f1e1c]">&#8377;{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#48805b]">
                        {purchaseMode === 'subscription' ? 'Subscription Discount' : 'Pack Discount'}
                      </span>
                      <span className="text-[#48805b]">-&#8377;{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {purchaseMode === 'subscription' && subPack && (
                    <div className="flex items-center gap-1.5 text-xs text-[#48805b] pt-1">
                      <Repeat className="w-3 h-3" />
                      <span>{subPack.label} · {subPack.frequency} delivery</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#88837b]">Shipping</span>
                    <span className="text-[#48805b] font-medium">FREE</span>
                  </div>
                </div>

                <Separator className="my-4 bg-[#e3dfd8]" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-heading text-base font-bold text-[#1f1e1c]">Total</span>
                  <span className="font-heading text-xl font-bold text-[#48805b]">
                    &#8377;{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Delivery Estimate */}
                <div className="mt-4 p-3 bg-[#48805b]/5 border border-[#48805b]/15 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-[#48805b]" />
                    <span className="text-[#1f1e1c] font-medium">Estimated delivery</span>
                  </div>
                  <p className="text-xs text-[#88837b] mt-1">3–5 business days across India</p>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="w-full bg-[#48805b] hover:bg-[#48805b]/90 text-white py-3.5 rounded-lg font-semibold text-base shadow-md transition-all hover:shadow-lg disabled:opacity-60"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'COD' ? (
                        <>
                          <Banknote className="w-4 h-4 mr-1.5" />
                          Place Order (COD) — &#8377;{totalAmount.toLocaleString('en-IN')}
                        </>
                      ) : (
                        <>
                          Place Order — &#8377;{totalAmount.toLocaleString('en-IN')}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Sticky Mobile Footer */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-white border-t border-[#e3dfd8] shadow-lg">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <span className="font-heading font-bold text-[#1f1e1c]">Total</span>
            <span className="font-heading font-bold text-lg text-[#48805b]">&#8377;{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <Button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full bg-[#48805b] hover:bg-[#48805b]/90 text-white py-3.5 rounded-lg font-semibold text-base shadow-md disabled:opacity-60"
          >
            {placing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                {paymentMethod === 'COD' ? 'Place Order (COD)' : 'Place Order'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Lock Step Indicator ────────────────────────────────────
function LockStep({ active, total, current }: { active: number; total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map(step => (
        <React.Fragment key={step}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            step <= active
              ? 'bg-[#48805b] text-white'
              : step === current
              ? 'bg-[#48805b]/20 text-[#48805b] border-2 border-[#48805b]'
              : 'bg-[#e3dfd8] text-[#88837b]'
          }`}>
            {step < active ? <CheckCircle className="w-3.5 h-3.5" /> : step}
          </div>
          {step < total && (
            <div className={`w-4 h-0.5 ${step < active ? 'bg-[#48805b]' : 'bg-[#e3dfd8]'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// OrderSuccessView — Success page after order is placed
// Handles COD, online payment return, and payment status polling
// ═══════════════════════════════════════════════════════════
export function OrderSuccessView() {
  const { lastOrderId, lastOrderNumber, lastPaymentMethod, navigateTo, user } = useAppStore()

  // ── Payment return handling (PhonePe redirect back) ──
  // Read order number from URL on first render
  const [orderNumberFromUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('payment') === 'return') {
        return params.get('orderNumber')
      }
    }
    return null
  })
  // Start as 'checking' if we have an orderNumber from URL (returning from PhonePe)
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'completed' | 'failed' | 'pending' | null>(
    () => orderNumberFromUrl ? 'checking' : null
  )
  // Track whether polling is active
  const pollingActiveRef = useRef(false)
  const paymentCallbackSentRef = useRef(false)

  useEffect(() => {
    if (!orderNumberFromUrl || pollingActiveRef.current) return
    pollingActiveRef.current = true
    paymentCallbackSentRef.current = false

    // Poll payment status
    let interval: ReturnType<typeof setInterval> | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/payments/phonepe/status?merchantOrderId=${orderNumberFromUrl}`)
        const data = await res.json()

        if (data.success && data.status === 'COMPLETED') {
          setPaymentStatus('completed')
          pollingActiveRef.current = false
          if (!paymentCallbackSentRef.current) {
            paymentCallbackSentRef.current = true
            if (interval) clearInterval(interval)
            if (timeout) clearTimeout(timeout)
            // Also confirm with callback to update order in DB
            fetch('/api/payments/phonepe/callback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ merchantOrderId: orderNumberFromUrl, status: 'COMPLETED' }),
            }).catch(() => {})
          }
        } else if (data.status === 'FAILED') {
          setPaymentStatus('failed')
          pollingActiveRef.current = false
          if (interval) clearInterval(interval)
          if (timeout) clearTimeout(timeout)
        } else {
          setPaymentStatus('pending')
        }
      } catch {
        setPaymentStatus('pending')
      }
    }

    // Poll immediately, then every 3 seconds for up to 30 seconds
    pollStatus()
    interval = setInterval(pollStatus, 3000)
    timeout = setTimeout(() => {
      if (interval) clearInterval(interval)
      pollingActiveRef.current = false
      setPaymentStatus(prev => prev === 'checking' ? 'pending' : prev)
    }, 30000)

    return () => {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [orderNumberFromUrl])

  const isOnlinePayment = lastPaymentMethod && lastPaymentMethod !== 'COD'
  const displayOrderNumber = orderNumberFromUrl || lastOrderNumber
  const isPaymentReturn = !!orderNumberFromUrl

  // Payment status messages
  const getPaymentStatusContent = () => {
    if (paymentStatus === 'checking') {
      return (
        <div className="mt-3 p-3 bg-[#2e91b2]/5 border border-[#2e91b2]/15 rounded-lg">
          <p className="text-sm text-[#2e91b2] flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying payment status...
          </p>
        </div>
      )
    }
    if (paymentStatus === 'completed') {
      return (
        <div className="mt-3 p-3 bg-[#48805b]/5 border border-[#48805b]/15 rounded-lg">
          <p className="text-sm text-[#48805b] flex items-center justify-center gap-1.5 font-medium">
            <CheckCircle className="w-4 h-4" />
            Payment confirmed! Your order is being processed.
          </p>
        </div>
      )
    }
    if (paymentStatus === 'failed') {
      return (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center justify-center gap-1.5 font-medium">
            <X className="w-4 h-4" />
            Payment failed. Please retry from My Orders.
          </p>
        </div>
      )
    }
    if (paymentStatus === 'pending') {
      return (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Payment is being processed. We&apos;ll confirm shortly.
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen flex flex-col bg-[#f4f3f0]"
    >
      <motion.div variants={fadeInUp} className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12 flex items-center">
        <div className="w-full text-center bg-white border border-[#e3dfd8] rounded-2xl shadow-sm p-5 sm:p-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-full bg-[#48805b]/10 flex items-center justify-center">
            {paymentStatus === 'failed' ? (
              <X className="w-12 h-12 sm:w-14 sm:h-14 text-red-500" />
            ) : (
              <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-[#48805b]" />
            )}
          </div>

          <motion.h2
            variants={fadeInUp}
            className="font-heading text-2xl sm:text-3xl font-bold text-[#1f1e1c] mb-2 leading-tight"
          >
            {paymentStatus === 'failed'
              ? 'Payment not completed'
              : isOnlinePayment || isPaymentReturn
                ? 'Order placed, payment pending confirmation'
                : 'Order placed successfully'}
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="text-[#88837b] mb-2 text-sm sm:text-base max-w-xl mx-auto"
          >
            {paymentStatus === 'failed'
              ? 'Your payment could not be processed. Please retry from My Orders.'
              : isOnlinePayment || isPaymentReturn
                ? 'We will send the WhatsApp and email confirmation only after payment is confirmed.'
                : 'Your order is confirmed. We will keep you updated as it moves ahead.'
            }
          </motion.p>

        <motion.div variants={fadeInUp} className="space-y-3">
          <Button
            onClick={() => navigateTo('profile')}
            className="bg-[#48805b] hover:bg-[#48805b]/90 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-md transition-all hover:shadow-lg w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
          {lastOrderId && (
            <Button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/invoices/by-order/${lastOrderId}`)
                  const data = await res.json()
                  if (data?.data?.download_url) {
                    window.open(data.data.download_url, '_blank')
                  } else {
                    toast.error('Invoice not ready yet — please check your orders page shortly.')
                  }
                } catch {
                  toast.error('Failed to load invoice')
                }
              }}
              variant="outline"
              className="w-full border-[#1f1e1c] text-[#1f1e1c] hover:bg-[#1f1e1c] hover:text-white rounded-lg py-3 font-semibold transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
          )}
          <Button
            onClick={() => navigateTo('products')}
            className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white rounded-lg py-3 font-semibold shadow-md transition-all hover:shadow-lg"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Keep Shopping
          </Button>
        </motion.div>
        </div>
      </motion.div>
      <SiteFooter />
    </motion.div>
  )
}
