'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Lock, User, MapPin, Shield, Eye, EyeOff, AlertCircle, MessageCircle, Leaf, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { authService } from '@/lib/data-service'
import type { UserProfile } from '@/lib/data-service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
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

// ─── Indian States List ────────────────────────────────────
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

// ─── Animation ────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ─── Password Strength ─────────────────────────────────────
function getPasswordStrength(password: string): { level: string; color: string; percent: number } {
  if (!password) return { level: '', color: '', percent: 0 }
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 2) return { level: 'Weak', color: '#ef4444', percent: 33 }
  if (score <= 3) return { level: 'Medium', color: '#f59e0b', percent: 66 }
  return { level: 'Strong', color: BRAND.green, percent: 100 }
}

// ============================================================
// LOGIN VIEW (Enhanced)
// ============================================================
export function AuthLogin() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin } = useAppStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    if (!identifier.trim()) {
      setError('Please enter your email or phone number')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const result = await authService.login(identifier.trim(), password)
      setUser(result.user as UserProfile)
      toast.success(`Welcome back, ${result.user.name}!`)

      if (redirectAfterLogin) {
        setRedirectAfterLogin(null)
        navigateTo(redirectAfterLogin)
      } else {
        navigateTo(result.user.is_admin ? 'admin-dashboard' : 'landing')
      }
    } catch (err: any) {
      const msg = err?.message || 'Login failed'
      if (msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('rate')) {
        setError('Too many attempts. Please try again later.')
      } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('Invalid email/phone or password')
      } else if (msg.toLowerCase().includes('not set up')) {
        setError('This account is not set up for password login. Please register first.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-20 pb-12 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Brand logo/leaf icon + Shield */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
              <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#48805b]" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
            </div>
            <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-[#88837b]">
              Sign in to continue your wellness journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email/Phone input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1f1e1c]">
                Email or Phone
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                <Input
                  type="text"
                  placeholder="you@example.com or +91 98765 43210"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(null) }}
                  className="h-12 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-[#1f1e1c]">
                  Password
                </Label>
                <button
                  onClick={() => navigateTo('auth-forgot-password')}
                  className="text-xs text-[#48805b] hover:underline focus:underline min-h-[44px] inline-flex items-center"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  className="h-12 pl-10 pr-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88837b] hover:text-[#1f1e1c] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Keep me signed in */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="keep-signed-in"
                checked={keepSignedIn}
                onCheckedChange={(checked) => setKeepSignedIn(checked === true)}
                className="data-[state=checked]:bg-[#48805b] data-[state=checked]:border-[#48805b]"
              />
              <Label htmlFor="keep-signed-in" className="text-sm text-[#88837b] cursor-pointer">
                Keep me signed in
              </Label>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Login'
              )}
            </Button>

            <Button
              onClick={() => navigateTo('auth-whatsapp-otp')}
              variant="outline"
              className="w-full h-12 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Login with WhatsApp OTP
            </Button>

            <Separator className="bg-[#e3dfd8]" />

            {/* Admin note */}
            <div className="text-center text-xs text-[#88837b] bg-[#e3dfd8]/50 rounded-lg p-3">
              <p className="font-medium">
                Admin: use <span className="font-bold text-[#1f1e1c]">admin@notjust.com</span> / <span className="font-bold text-[#1f1e1c]">admin123</span>
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigateTo('auth-register')}
                className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
              >
                Register instead
              </button>
            </p>
          </CardFooter>

          {/* Footer links */}
          <div className="text-center text-xs text-[#88837b] pb-4">
            <p>Privacy Policy · Terms of Service</p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================
// REGISTER VIEW (Enhanced with Steps)
// ============================================================
export function AuthRegister() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin } = useAppStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    gender: '',
    state: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.email.trim() && !form.phone.trim()) errors.email = 'Email or phone is required'
    if (!form.password) errors.password = 'Password is required'
    if (form.password && form.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (form.email.trim() && !form.email.includes('@')) errors.email = 'Please enter a valid email address'
    if (!termsAccepted) errors.terms = 'You must agree to the Terms of Service'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async () => {
    if (!validateStep1()) return
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const result = await authService.register({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        country: 'India',
        state: form.state || undefined,
      })

      setUser(result.user as UserProfile)
      toast.success(`Welcome, ${result.user.name}! Your account has been created.`)

      if (redirectAfterLogin) {
        setRedirectAfterLogin(null)
        navigateTo(redirectAfterLogin)
      } else {
        navigateTo('landing')
      }
    } catch (err: any) {
      const msg = err?.message || 'Registration failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email or phone is already registered. Please login instead.')
      } else if (msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('rate')) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-20 pb-12 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Brand icon */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
              <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center">
                <User className="w-7 h-7 text-[#48805b]" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
            </div>
            <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
              Create Account
            </CardTitle>
            <CardDescription className="text-[#88837b]">
              Join the NotJust wellness movement
            </CardDescription>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#48805b]' : 'text-[#88837b]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-[#48805b] text-white' : 'bg-[#e3dfd8] text-[#88837b]'}`}>1</div>
                <span className="text-xs font-medium">Account</span>
              </div>
              <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[#48805b]' : 'bg-[#e3dfd8]'}`} />
              <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#48805b]' : 'text-[#88837b]'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[#48805b] text-white' : 'bg-[#e3dfd8] text-[#88837b]'}`}>2</div>
                <span className="text-xs font-medium">Profile</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-2">
            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" variants={slideInRight} initial="hidden" animate="visible" className="space-y-3">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1f1e1c]">
                      Full Name <span className="text-[#48805b]">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Input
                        placeholder="Your full name"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={`h-11 pl-10 ${fieldErrors.name ? 'border-red-400 focus:border-red-400' : 'border-[#e3dfd8] focus:border-[#48805b]'} focus:ring-[#48805b]/20`}
                      />
                    </div>
                    {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1f1e1c]">
                        Email <span className="text-[#88837b]">(or Phone below)</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className={`h-11 pl-10 ${fieldErrors.email ? 'border-red-400 focus:border-red-400' : 'border-[#e3dfd8] focus:border-[#48805b]'} focus:ring-[#48805b]/20`}
                          autoComplete="email"
                        />
                      </div>
                      {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1f1e1c]">
                        Phone <span className="text-[#88837b]">(or Email above)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="h-11 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1f1e1c]">
                      Password <span className="text-[#48805b]">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={form.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className={`h-11 pl-10 pr-10 ${fieldErrors.password ? 'border-red-400 focus:border-red-400' : 'border-[#e3dfd8] focus:border-[#48805b]'} focus:ring-[#48805b]/20`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88837b] hover:text-[#1f1e1c] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password}</p>}

                    {/* Password strength indicator */}
                    {form.password && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#e3dfd8] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.percent}%` }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: passwordStrength.color }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                            {passwordStrength.level}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => {
                          setTermsAccepted(checked === true)
                          if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }))
                        }}
                        className="data-[state=checked]:bg-[#48805b] data-[state=checked]:border-[#48805b] mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-xs text-[#88837b] cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <span className="text-[#48805b] font-medium">Terms of Service</span> and{' '}
                        <span className="text-[#48805b] font-medium">Privacy Policy</span>
                      </Label>
                    </div>
                    {fieldErrors.terms && <p className="text-xs text-red-500">{fieldErrors.terms}</p>}
                  </div>

                  {/* Step 1: Next button */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="h-11 border-[#e3dfd8] text-[#88837b] hover:bg-[#e3dfd8]/50 font-heading font-semibold rounded-xl min-h-[44px]"
                    >
                      Skip to Profile
                    </Button>
                    <Button
                      onClick={handleRegister}
                      disabled={loading}
                      className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        'Register Now'
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="step2" variants={slideInRight} initial="hidden" animate="visible" className="space-y-3">
                  {/* Age and Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1f1e1c]">Age</Label>
                      <Input
                        type="number"
                        placeholder="Your age"
                        value={form.age}
                        onChange={(e) => updateField('age', e.target.value)}
                        className="h-11 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                        min={1}
                        max={120}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-[#1f1e1c]">Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) => updateField('gender', v)}
                      >
                        <SelectTrigger className="h-11 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1f1e1c]">State</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Select
                        value={form.state}
                        onValueChange={(v) => updateField('state', v)}
                      >
                        <SelectTrigger className="h-11 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 w-full">
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Step 2 buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="h-11 border-[#e3dfd8] text-[#88837b] hover:bg-[#e3dfd8]/50 font-heading font-semibold rounded-xl min-h-[44px]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleRegister}
                      disabled={loading}
                      className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </span>
                      ) : (
                        'Complete Registration'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              Already have an account?{' '}
              <button
                onClick={() => navigateTo('auth-login')}
                className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
              >
                Login instead
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================
// FORGOT PASSWORD VIEW (NEW — Multi-step)
// ============================================================
export function AuthForgotPassword() {
  const { navigateTo } = useAppStore()
  // Step: 'email' → 'otp' → 'reset'
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devOtp, setDevOtp] = useState<string | null>(null) // For dev mode testing

  // Step 1: Send verification code
  const handleSendCode = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code')
        return
      }

      // Save otp_id for next step
      if (data.otp_id) {
        setOtpId(data.otp_id)
      }
      if (data.dev_otp) {
        setDevOtp(data.dev_otp)
      }

      toast.success('Verification code sent! Check your email.')
      setStep('otp')
    } catch (err: any) {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError(null)
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }
    if (!otpId) {
      setError('Verification session expired. Please start over.')
      setStep('email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_id: otpId, otp_code: otpCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      if (data.verified) {
        setUserId(data.user_id)
        toast.success('Code verified! You can now reset your password.')
        setStep('reset')
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err: any) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset password
  const handleResetPassword = async () => {
    setError(null)
    if (!newPassword) {
      setError('Please enter a new password')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!otpId) {
      setError('Verification session expired. Please start over.')
      setStep('email')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp_id: otpId,
          new_password: newPassword,
          user_id: userId,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      if (data.success) {
        toast.success('Password reset successfully! You can now login.')
        navigateTo('auth-login')
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } catch (err: any) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const newPasswordStrength = getPasswordStrength(newPassword)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-20 pb-12 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Brand icon */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
              <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-[#48805b]" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#afb75d]/20 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#afb75d]" />
              </div>
            </div>
            <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
              Reset Your Password
            </CardTitle>
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.p key="email-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#88837b] text-sm mt-1">
                  Enter your email address and we&apos;ll send you a verification code
                </motion.p>
              )}
              {step === 'otp' && (
                <motion.p key="otp-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#88837b] text-sm mt-1">
                  Enter the 6-digit code sent to your email
                </motion.p>
              )}
              {step === 'reset' && (
                <motion.p key="reset-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#88837b] text-sm mt-1">
                  Create a new password for your account
                </motion.p>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Step: Email input */}
              {step === 'email' && (
                <motion.div key="email-step" variants={slideInRight} initial="hidden" animate="visible" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1f1e1c]">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                        className="h-12 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending code...
                      </span>
                    ) : (
                      'Send Verification Code'
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step: OTP verification */}
              {step === 'otp' && (
                <motion.div key="otp-step" variants={slideInRight} initial="hidden" animate="visible" className="space-y-4">
                  {/* Dev mode hint */}
                  {devOtp && (
                    <div className="text-center text-xs text-[#48805b] bg-[#48805b]/10 rounded-lg p-3">
                      <p className="font-medium">Dev mode — OTP: <span className="font-bold">{devOtp}</span></p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1f1e1c]">
                      Verification Code
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpCode}
                        onChange={(value) => { setOtpCode(value); setError(null) }}
                        containerClassName="gap-2"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                          <InputOTPSlot index={1} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                          <InputOTPSlot index={2} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                          <InputOTPSlot index={4} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                          <InputOTPSlot index={5} className="h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifyOtp}
                    disabled={loading || otpCode.length !== 6}
                    className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <button
                    onClick={() => { setStep('email'); setOtpCode(''); setOtpId(null); setError(null) }}
                    className="w-full text-center text-sm text-[#48805b] font-medium hover:underline min-h-[44px] inline-flex items-center justify-center"
                  >
                    Didn&apos;t receive the code? Try again
                  </button>
                </motion.div>
              )}

              {/* Step: Reset password */}
              {step === 'reset' && (
                <motion.div key="reset-step" variants={slideInRight} initial="hidden" animate="visible" className="space-y-4">
                  {/* Verified badge */}
                  <div className="flex items-center justify-center gap-2 text-[#48805b]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Code verified successfully</span>
                  </div>

                  {/* New password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1f1e1c]">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(null) }}
                        className="h-12 pl-10 pr-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88837b] hover:text-[#1f1e1c] transition-colors"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength */}
                    {newPassword && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#e3dfd8] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${newPasswordStrength.percent}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: newPasswordStrength.color }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: newPasswordStrength.color }}>
                          {newPasswordStrength.level}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1f1e1c]">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                        className="h-12 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                        autoComplete="new-password"
                      />
                    </div>
                    {confirmPassword && newPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting password...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              Remember your password?{' '}
              <button
                onClick={() => navigateTo('auth-login')}
                className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
              >
                Login
              </button>
            </p>
          </CardFooter>

          {/* Footer links */}
          <div className="text-center text-xs text-[#88837b] pb-4">
            <p>Privacy Policy · Terms of Service</p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
