'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  MapPin, Phone, CreditCard, Landmark, Smartphone, CheckCircle,
  Package, Truck, ShieldCheck, ChevronRight, X, Loader2,
  ShoppingCart, Sparkles, Leaf, Banknote, Mail
} from 'lucide-react'
import { useAppStore, type CartItem } from '@/store/app-store'
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
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goBack()}
            className="text-[#1f1e1c] hover:bg-[#e3dfd8] rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold text-[#1f1e1c] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#48805b]" />
            Shopping Cart
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
        className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {cart.map((item) => (
            <CartItemCard
              key={item.productId}
              item={item}
              isRemoving={removingIds.has(item.productId)}
              onQuantityChange={(qty) => updateCartQuantity(item.productId, qty)}
              onRemove={() => handleRemove(item.productId)}
            />
          ))}
        </AnimatePresence>

        {/* Continue Shopping */}
        <motion.div variants={fadeInUp} className="pt-2">
          <Button
            variant="outline"
            onClick={() => navigateTo('products')}
            className="w-full border-[#e3dfd8] text-[#88837b] hover:text-[#48805b] hover:border-[#48805b]/30 rounded-lg py-2.5"
          >
            <Leaf className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </motion.div>
      </motion.div>

      {/* Sticky Footer with Total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } }}
        className="sticky bottom-0 z-30 bg-white border-t border-[#e3dfd8] shadow-lg shadow-[#e3dfd8]/30"
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Price breakdown */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm text-[#88837b]">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>&#8377;{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm text-[#88837b]">
              <span>Taxes & fees</span>
              <span>Calculated at checkout</span>
            </div>
          </div>
          <Separator className="mb-3 bg-[#e3dfd8]" />
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading text-lg font-bold text-[#1f1e1c]">Estimated Total</span>
            <span className="font-heading text-xl font-bold text-[#48805b]">&#8377;{total.toLocaleString('en-IN')}</span>
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
          <div className="flex gap-3 sm:gap-4">
            {/* Product Image */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 bg-[#e3dfd8] rounded-l-lg overflow-hidden relative">
              {item.imageUrl ? (
                <Image
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
            <div className="flex-1 min-w-0 py-3 pr-2 sm:py-4 sm:pr-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold text-[#1f1e1c] text-sm sm:text-base truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
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
              <div className="flex items-center justify-between mt-2 sm:mt-3">
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
              <div className="text-right mt-1">
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
    setLastOrderId, setRedirectAfterLogin, setUser
  } = useAppStore()

  // ── Form State ──
  const [shippingName, setShippingName] = useState(user?.name || '')
  const [shippingPhone, setShippingPhone] = useState(user?.phone || '')
  const [shippingEmail, setShippingEmail] = useState(user?.email || '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingState, setShippingState] = useState(user?.state || '')
  const [shippingPincode, setShippingPincode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [placing, setPlacing] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Derived ──
  const subtotal = cartTotal()
  const taxAmount = Math.round(subtotal * 0.18)
  const discountAmount = cart.reduce((sum, item) => sum + ((item.packDiscount || 0) / 100) * item.price * item.quantity, 0)
  const totalAmount = subtotal + taxAmount - discountAmount
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

    if (!shippingName.trim()) errors.shippingName = 'Name is required'
    if (!shippingPhone.trim()) errors.shippingPhone = 'Phone is required'
    else if (!/^[\d]{10}$/.test(shippingPhone.trim())) errors.shippingPhone = 'Enter a valid 10-digit phone number'
    if (!shippingEmail.trim()) errors.shippingEmail = 'Email is required for order confirmation'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingEmail.trim())) errors.shippingEmail = 'Enter a valid email address'
    if (!shippingAddress.trim()) errors.shippingAddress = 'Address is required'
    if (!shippingCity.trim()) errors.shippingCity = 'City is required'
    if (!shippingState) errors.shippingState = 'State is required'
    if (!shippingPincode.trim()) errors.shippingPincode = 'Pincode is required'
    else if (!/^[\d]{6}$/.test(shippingPincode.trim())) errors.shippingPincode = 'Enter a valid 6-digit pincode'

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
      const orderData = {
        user_id: user.id,
        items: cart.map(item => ({
          product_id: item.productId,
          product_name: item.name,
          product_type: item.type || 'FIZZ',
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          pack_type: item.packType || null,
          pack_days: item.packDays || null,
          pack_discount: item.packDiscount || null,
        })),
        shipping_name: shippingName.trim(),
        shipping_phone: shippingPhone.trim(),
        shipping_email: shippingEmail.trim(),
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_state: shippingState,
        shipping_pincode: shippingPincode.trim(),
        payment_method: paymentMethod,
      }

      const order = await orderService.create(orderData)

      // Success — update local user state with email if it was missing from profile
      if (user && shippingEmail.trim() && !user.email) {
        setUser({ ...user, email: shippingEmail.trim() })
      }

      setLastOrderId(order.id)
      clearCart()
      toast.success('Order placed successfully! 🎉', {
        description: `Order #${order.order_number || order.id}`,
        duration: 5000,
      })
      navigateTo('order-success')
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
        {/* Left Column — Shipping & Payment */}
        <div className="lg:col-span-3 space-y-5 mb-6 lg:mb-0">
          {/* Shipping Address */}
          <motion.div variants={fadeInUp}>
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
                    placeholder="Enter your full name"
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

                {/* Email — Required for order confirmation */}
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-email" className="text-sm font-medium text-[#1f1e1c]">
                    Email <span className="text-red-400">*</span>
                    <span className="text-[#88837b] font-normal ml-1">(for order confirmation)</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#88837b] shrink-0" />
                    <Input
                      id="shipping-email"
                      type="email"
                      value={shippingEmail}
                      onChange={e => setShippingEmail(e.target.value)}
                      placeholder="you@example.com"
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
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === option.value
                            ? 'bg-[#48805b]/10 text-[#48805b]'
                            : 'bg-[#e3dfd8] text-[#88837b]'
                        }`}>
                          {option.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#1f1e1c]">{option.label}</p>
                          <p className="text-xs text-[#88837b]">{option.description}</p>
                        </div>
                      </div>
                      {paymentMethod === option.value && (
                        <CheckCircle className="w-5 h-5 text-[#48805b] ml-auto" />
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
                  <div className="mt-4 p-3 bg-[#afb75d]/10 border border-[#afb75d]/20 rounded-lg">
                    <p className="text-xs text-[#88837b] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#48805b]" />
                      Razorpay payment gateway integration coming soon. Your order will be created with &quot;PENDING&quot; payment status.
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
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#e3dfd8] overflow-hidden flex-shrink-0 relative">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
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
                      <span className="text-[#48805b]">Pack Discount</span>
                      <span className="text-[#48805b]">-&#8377;{discountAmount.toLocaleString('en-IN')}</span>
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
// ═══════════════════════════════════════════════════════════
export function OrderSuccessView() {
  const { lastOrderId, navigateTo, cart, user } = useAppStore()

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#f4f3f0]"
    >
      <motion.div variants={fadeInUp} className="text-center max-w-md">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#48805b]/10 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-[#48805b]" />
        </div>

        <motion.h2
          variants={fadeInUp}
          className="font-heading text-2xl sm:text-3xl font-bold text-[#1f1e1c] mb-2"
        >
          Order Placed Successfully!
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-[#88837b] mb-2 text-base"
        >
          Your wellness shots are on their way. We&apos;ll notify you when they ship.
        </motion.p>

        {/* Email confirmation notice */}
        {user?.email && (
          <motion.div
            variants={fadeInUp}
            className="mt-3 p-3 bg-[#2e91b2]/5 border border-[#2e91b2]/15 rounded-lg"
          >
            <p className="text-sm text-[#2e91b2] flex items-center justify-center gap-1.5 font-medium">
              <Mail className="w-4 h-4" />
              Order confirmation sent to {user.email}
            </p>
          </motion.div>
        )}

        <motion.div
          variants={fadeInUp}
          className="mt-3 p-3 bg-[#48805b]/5 border border-[#48805b]/15 rounded-lg"
        >
          <p className="text-sm text-[#48805b] flex items-center justify-center gap-1.5 font-medium">
            <Banknote className="w-4 h-4" />
            Pay on Delivery — Keep the exact amount ready when your order arrives.
          </p>
        </motion.div>

        {lastOrderId && (
          <motion.p
            variants={fadeInUp}
            className="text-sm text-[#88837b] mb-8"
          >
            Order ID: <span className="font-semibold text-[#1f1e1c]">{lastOrderId}</span>
          </motion.p>
        )}

        <motion.div variants={fadeInUp} className="space-y-3">
          <Button
            onClick={() => navigateTo('profile')}
            className="bg-[#48805b] hover:bg-[#48805b]/90 text-white px-8 py-3 rounded-lg font-semibold text-base shadow-md transition-all hover:shadow-lg w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateTo('products')}
            className="w-full border-[#e3dfd8] text-[#88837b] hover:text-[#48805b] hover:border-[#48805b]/30 rounded-lg py-3 font-semibold"
          >
            <Leaf className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </motion.div>
      </motion.div>
      <SiteFooter />
    </motion.div>
  )
}
