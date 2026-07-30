'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Lock, User, MapPin, Shield, Eye, EyeOff, AlertCircle, MessageCircle, Leaf, KeyRound, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
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
  whatsappGreen: '#25D366',
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
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

// ─── Contact Type Detection ─────────────────────────────────
type ContactType = 'email' | 'phone' | 'unknown'

function detectContactType(input: string): ContactType {
  const trimmed = input.trim()
  if (trimmed.includes('@')) return 'email'
  // If it looks like a phone number (mostly digits)
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 10 && digits.length <= 12) return 'phone'
  if (trimmed.length > 0 && /^\+?\d[\d\s\-()]{7,}$/.test(trimmed)) return 'phone'
  return 'unknown'
}

function validateEmail(email: string): boolean {
  return email.includes('@') && email.includes('.') && email.trim().length > 3
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  let localDigits = digits
  if (localDigits.startsWith('91') && localDigits.length === 12) localDigits = localDigits.slice(2)
  if (localDigits.startsWith('0') && localDigits.length === 11) localDigits = localDigits.slice(1)
  return localDigits.length === 10
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  let localDigits = digits
  if (localDigits.startsWith('91') && localDigits.length === 12) localDigits = localDigits.slice(2)
  if (localDigits.startsWith('0') && localDigits.length === 11) localDigits = localDigits.slice(1)
  return localDigits
}

// ─── OTP Slot Styling ────────────────────────────────────────
const otpSlotClass = "h-12 w-12 text-lg font-bold border-[#e3dfd8] data-[active=true]:border-[#48805b] data-[active=true]:ring-[#48805b]/20"

// ============================================================
// LOGIN VIEW (Professional)
// ============================================================
export function AuthLogin() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin, user, goBack } = useAppStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Redirect if already logged in ──
  useEffect(() => {
    if (user) {
      navigateTo(redirectAfterLogin || 'landing')
    }
  }, [user, redirectAfterLogin, navigateTo])

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
      {/* Back to Home button */}
      <button
        onClick={goBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-[#88837b] hover:text-[#1f1e1c] text-sm font-medium transition-colors min-h-[44px] px-3 py-2 rounded-lg hover:bg-[#e3dfd8]/50"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <Card className="border-[#e3dfd8] shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Brand icons */}
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
                  placeholder="you@example.com or 9876543210"
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

            {/* Or divider */}
            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#e3dfd8]" />
              <span className="text-xs text-[#88837b] font-medium uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-[#e3dfd8]" />
            </div>

            <Button
              onClick={() => navigateTo('auth-whatsapp-otp')}
              className="w-full h-12 bg-[#25D366] hover:bg-[#20b85a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Login with WhatsApp
            </Button>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-[#88837b]">
              New user?{' '}
              <button
                onClick={() => navigateTo('auth-register')}
                className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
              >
                Create an account
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
// REGISTER VIEW — 3-Step Professional Registration Flow
// ============================================================
export function AuthRegister() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin, user, goBack } = useAppStore()

  // ── Redirect if already logged in ──
  useEffect(() => {
    if (user) {
      navigateTo(redirectAfterLogin || 'landing')
    }
  }, [user, redirectAfterLogin, navigateTo])

  // ── Step management ──
  // Step 1: 'contact' → enter mobile/email → 'otp' → verify OTP → 'existing' (if user exists) or proceed to step 2
  // Step 2: 'details' → name + password + terms → register
  // Step 3: 'profile' → optional age/gender/state → skip or save → auto-login & redirect
  const [step, setStep] = useState<'contact' | 'otp' | 'existing' | 'details' | 'profile' | 'success'>('contact')

  // ── Contact info (Step 1) ──
  const [contactInput, setContactInput] = useState('')
  const [contactType, setContactType] = useState<ContactType>('unknown')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [contactMasked, setContactMasked] = useState('')
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(3)

  // ── Registration details (Step 2) ──
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // ── Optional profile (Step 3) ──
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [state, setState] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // ── Common ──
  const [error, setError] = useState<string | null>(null)

  // ── Countdown timer for resend cooldown ──
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // ── Auto-redirect on success ──
  useEffect(() => {
    if (step !== 'success') return
    const timer = setTimeout(() => {
      if (redirectAfterLogin) {
        setRedirectAfterLogin(null)
        navigateTo(redirectAfterLogin)
      } else {
        navigateTo('landing')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [step])

  // ── Detect contact type when input changes ──
  const handleContactChange = (value: string) => {
    setContactInput(value)
    setError(null)
    const detected = detectContactType(value)
    setContactType(detected)
  }

  // ── Step 1: Send OTP ──
  const handleSendOtp = async () => {
    setError(null)
    const trimmed = contactInput.trim()
    const detected = detectContactType(trimmed)

    if (!trimmed) {
      setError('Please enter your mobile number or email address')
      return
    }

    if (detected === 'unknown') {
      setError('Please enter a valid 10-digit mobile number or email address')
      return
    }

    if (detected === 'email' && !validateEmail(trimmed)) {
      setError('Please enter a valid email address (must contain @ and domain)')
      return
    }

    if (detected === 'phone' && !validatePhone(trimmed)) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return
    }

    setSendingOtp(true)
    try {
      if (detected === 'phone') {
        // Use WhatsApp OTP for phone numbers
        const res = await fetch('/api/auth/whatsapp-otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: trimmed, purpose: 'WHATSAPP_LOGIN' }),
        })
        const data = await res.json()

        if (!res.ok || !data.success) {
          setError(data.message || data.error || 'Failed to send OTP')
          setSendingOtp(false)
          return
        }

        setOtpId(data.otp_id)
        setContactMasked(data.phone_masked || `+91 ${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`)

        // OTP is sent via WhatsApp to the user's phone — never expose it in the UI

        toast.success(`WhatsApp OTP sent to ${data.phone_masked}`)
      } else {
        // Use email OTP for email addresses
        const res = await fetch('/api/auth/verify-email-otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed.toLowerCase() }),
        })
        const data = await res.json()

        if (!res.ok) {
          // Check for "already registered" error
          if (data.error && data.error.toLowerCase().includes('already registered')) {
            setStep('existing')
            setSendingOtp(false)
            return
          }
          setError(data.error || 'Failed to send verification code')
          setSendingOtp(false)
          return
        }

        setOtpId(data.otp_id)
        setContactMasked(trimmed)
        // OTP is sent via email to the user — never expose it in the UI

        toast.success('Verification code sent to your email')
      }

      setStep('otp')
      setResendCooldown(30)
      setOtpCode('')
      setOtpAttemptsRemaining(3)
      setSendingOtp(false)
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
      setSendingOtp(false)
    }
  }

  // ── Step 1: Resend OTP ──
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setOtpCode('')
    setError(null)
    setOtpAttemptsRemaining(3)
    await handleSendOtp()
  }

  // ── Step 1: Verify OTP ──
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6 || !otpId) return

    setVerifyingOtp(true)
    setError(null)

    try {
      const detected = contactType
      let verifyRes: Response

      if (detected === 'phone') {
        verifyRes = await fetch('/api/auth/whatsapp-otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp_id: otpId, otp_code: otpCode }),
        })
      } else {
        verifyRes = await fetch('/api/auth/verify-email-otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            otp_id: otpId,
            otp_code: otpCode,
            email: contactInput.trim().toLowerCase(),
          }),
        })
      }

      const data = await verifyRes.json()

      if (!data.success && !data.verified) {
        setVerifyingOtp(false)
        setError(data.message || data.error || 'Verification failed')
        setOtpAttemptsRemaining(prev => Math.max(0, prev - 1))

        if (data.message?.includes('expired') || data.message?.includes('Maximum')) {
          setOtpId(null)
        }
        return
      }

      // OTP verified — check if user exists
      const contact = contactInput.trim()
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          detected === 'email'
            ? { email: contact.toLowerCase() }
            : { phone: contact }
        ),
      })
      const checkData = await checkRes.json()

      if (checkData.exists) {
        setVerifyingOtp(false)
        setStep('existing')
        return
      }

      // New user — proceed to step 2 (details)
      setVerifyingOtp(false)
      toast.success('Verified! Let\'s set up your account.')
      setStep('details')
    } catch (err: any) {
      setVerifyingOtp(false)
      setError('Verification failed. Please try again.')
    }
  }

  // ── Step 2: Validate & Register ──
  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!password) errors.password = 'Password is required'
    if (password && password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (!termsAccepted) errors.terms = 'You must agree to the Terms of Service'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async () => {
    if (!validateDetails()) return
    setError(null)
    setFieldErrors({})
    setRegistering(true)

    try {
      const detected = contactType
      const contact = contactInput.trim()

      const result = await authService.register({
        name: name.trim(),
        email: detected === 'email' ? contact.toLowerCase() : undefined,
        phone: detected === 'phone' ? formatPhone(contact) : undefined,
        password: password,
        country: 'India',
      })

      setUser(result.user as UserProfile)

      // Proceed to optional profile step (step 3)
      setRegistering(false)
      toast.success(`Welcome! Your account has been created.`)
      setStep('profile')
    } catch (err: any) {
      setRegistering(false)
      const msg = err?.message || 'Registration failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email or phone is already registered. Please login instead.')
      } else if (msg.toLowerCase().includes('too many') || msg.toLowerCase().includes('rate')) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  // ── Step 3: Save optional profile ──
  const handleSaveProfile = async () => {
    setUpdatingProfile(true)
    try {
      const currentUser = useAppStore.getState().user
      if (!currentUser) {
        setStep('success')
        setUpdatingProfile(false)
        return
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          age: age ? parseInt(age) : null,
          gender: gender || null,
          state: state || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user as UserProfile)
        }
        toast.success('Profile updated!')
      }

      setStep('success')
    } catch (err: any) {
      setStep('success')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleSkipProfile = () => {
    setStep('success')
  }

  const passwordStrength = getPasswordStrength(password)

  // ── Render Step Indicator ──
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Verify', active: ['contact', 'otp', 'existing'].includes(step) },
      { num: 2, label: 'Account', active: step === 'details' },
      { num: 3, label: 'Profile', active: step === 'profile' || step === 'success' },
    ]

    const currentStepNum = step === 'contact' || step === 'otp' || step === 'existing' ? 1
      : step === 'details' ? 2
      : 3

    return (
      <div className="flex items-center justify-center gap-3 mt-3">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-1.5 ${s.active || currentStepNum > s.num ? 'text-[#48805b]' : 'text-[#88837b]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStepNum > s.num ? 'bg-[#48805b] text-white' :
                s.active ? 'bg-[#48805b] text-white' : 'bg-[#e3dfd8] text-[#88837b]'
              }`}>
                {currentStepNum > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${currentStepNum > s.num ? 'bg-[#48805b]' : 'bg-[#e3dfd8]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-20 pb-12 px-4">
      {/* Back button */}
      <button
        onClick={goBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-[#88837b] hover:text-[#1f1e1c] text-sm font-medium transition-colors min-h-[44px] px-3 py-2 rounded-lg hover:bg-[#e3dfd8]/50"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <AnimatePresence mode="wait">
        {/* ── Step 1a: Contact Input ── */}
        {step === 'contact' && (
          <motion.div
            key="contact-step"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
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
                  Create Account
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  Join the NotJust wellness movement
                </CardDescription>
                {renderStepIndicator()}
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
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

                {/* Contact type indicator */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1f1e1c]">
                    Mobile Number or Email
                  </Label>
                  <div className="relative">
                    {contactType === 'email' ? (
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48805b]" />
                    ) : contactType === 'phone' ? (
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#48805b]" />
                    ) : (
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    )}
                    <Input
                      type="text"
                      placeholder="Enter your mobile number or email"
                      value={contactInput}
                      onChange={(e) => handleContactChange(e.target.value)}
                      className="h-12 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                      autoComplete="username"
                    />
                  </div>
                  {contactInput.trim() && contactType !== 'unknown' && (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs border-[#48805b]/40 text-[#48805b] bg-[#48805b]/5">
                        {contactType === 'email' ? (
                          <><Mail className="w-3 h-3 mr-1" /> Email detected</>
                        ) : (
                          <><Phone className="w-3 h-3 mr-1" /> Phone detected</>
                        )}
                      </Badge>
                      {contactType === 'phone' && (
                        <span className="text-xs text-[#88837b]">WhatsApp OTP will be sent</span>
                      )}
                      {contactType === 'email' && (
                        <span className="text-xs text-[#88837b]">Verification code will be sent to your email</span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !contactInput.trim() || contactType === 'unknown'}
                  className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                >
                  {sendingOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending verification code...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pb-6">
                <p className="text-sm text-[#88837b]">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigateTo('auth-login')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Login
                  </button>
                </p>
                <button
                  onClick={() => navigateTo('auth-whatsapp-otp')}
                  className="text-sm text-[#25D366] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" /> Login with WhatsApp
                </button>
              </CardFooter>

              <div className="text-center text-xs text-[#88837b] pb-4">
                <p>Privacy Policy · Terms of Service</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Step 1b: OTP Verification ── */}
        {step === 'otp' && (
          <motion.div
            key="otp-step"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-[#48805b]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
                  Verify Your {contactType === 'phone' ? 'Phone' : 'Email'}
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  We sent a 6-digit code to <span className="font-semibold text-[#1f1e1c]">{contactMasked}</span>
                </CardDescription>
                {renderStepIndicator()}
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
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


                {/* OTP Entry */}
                <div className="flex flex-col items-center gap-2">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => { setOtpCode(value); setError(null) }}
                    disabled={verifyingOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className={otpSlotClass} />
                      <InputOTPSlot index={1} className={otpSlotClass} />
                      <InputOTPSlot index={2} className={otpSlotClass} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className={otpSlotClass} />
                      <InputOTPSlot index={4} className={otpSlotClass} />
                      <InputOTPSlot index={5} className={otpSlotClass} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-[#88837b]">
                    {otpAttemptsRemaining > 0
                      ? `${otpAttemptsRemaining} verification attempts remaining`
                      : 'No attempts remaining — please resend OTP'}
                  </p>
                </div>

                {/* Verify button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || verifyingOtp}
                  className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                >
                  {verifyingOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Verify & Continue
                    </span>
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendCooldown > 0
                    ? <p className="text-xs text-[#88837b]">Resend available in {resendCooldown}s</p>
                    : <Button
                        onClick={handleResendOtp}
                        variant="ghost"
                        className="text-[#48805b] text-sm min-h-[44px]"
                        disabled={sendingOtp}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        {contactType === 'phone' ? 'Resend WhatsApp OTP' : 'Resend verification code'}
                      </Button>}
                </div>

                {/* Back button */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    className="text-[#88837b] text-sm min-h-[44px]"
                    onClick={() => {
                      setStep('contact')
                      setOtpCode('')
                      setError(null)
                      setOtpId(null)
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Change {contactType === 'phone' ? 'phone number' : 'email address'}
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="justify-center pb-6">
                <p className="text-sm text-[#88837b]">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigateTo('auth-login')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Login
                  </button>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* ── Step 1c: Existing User ── */}
        {step === 'existing' && (
          <motion.div
            key="existing-step"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-[#afb75d]/10 flex items-center justify-center mx-auto mb-3">
                  <User className="w-7 h-7 text-[#afb75d]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
                  Account Already Exists
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  {contactType === 'phone'
                    ? `The phone number ${contactMasked} is already registered`
                    : `The email ${contactMasked} is already registered`
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-[#48805b]/5 border border-[#48805b]/20">
                  <p className="text-sm text-[#1f1e1c]">
                    You already have an account with this {contactType === 'phone' ? 'phone number' : 'email address'}.
                  </p>
                  <p className="text-sm text-[#88837b] mt-1">
                    Please login to continue your wellness journey.
                  </p>
                </div>

                <Button
                  onClick={() => navigateTo('auth-login')}
                  className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                >
                  Go to Login
                </Button>

                <Button
                  variant="ghost"
                  className="text-[#88837b] text-sm min-h-[44px] w-full"
                  onClick={() => {
                    setStep('contact')
                    setContactInput('')
                    setContactType('unknown')
                    setError(null)
                    setOtpId(null)
                    setOtpCode('')
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Use a different {contactType === 'phone' ? 'phone' : 'email'}
                </Button>
              </CardContent>

              <div className="text-center text-xs text-[#88837b] pb-4">
                <p>Privacy Policy · Terms of Service</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Basic Details ── */}
        {step === 'details' && (
          <motion.div
            key="details-step"
            initial="hidden"
            animate="visible"
            variants={slideInRight}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
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
                  Set Up Your Account
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  Verified! Now choose a password to secure your account
                </CardDescription>
                {renderStepIndicator()}
              </CardHeader>

              <CardContent className="space-y-3 pt-4">
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

                {/* Verified contact badge */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#48805b]/5 border border-[#48805b]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#48805b]" />
                  <span className="text-sm text-[#1f1e1c]">
                    {contactType === 'phone' ? 'Phone' : 'Email'} verified: <span className="font-semibold">{contactMasked}</span>
                  </span>
                </div>

                {/* Name field */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#1f1e1c]">
                    Full Name <span className="text-[#48805b]">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    <Input
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(null); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' })) }}
                      className={`h-11 pl-10 ${fieldErrors.name ? 'border-red-400 focus:border-red-400' : 'border-[#e3dfd8] focus:border-[#48805b]'} focus:ring-[#48805b]/20`}
                      autoComplete="off"
                    />
                  </div>
                  {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#1f1e1c]">
                    Password <span className="text-[#48805b]">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })) }}
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
                  {password && (
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

                {/* Keep me signed in */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="reg-keep-signed-in"
                    checked={keepSignedIn}
                    onCheckedChange={(checked) => setKeepSignedIn(checked === true)}
                    className="data-[state=checked]:bg-[#48805b] data-[state=checked]:border-[#48805b]"
                  />
                  <Label htmlFor="reg-keep-signed-in" className="text-sm text-[#88837b] cursor-pointer">
                    Keep me signed in
                  </Label>
                </div>

                {/* Terms checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="reg-terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => {
                        setTermsAccepted(checked === true)
                        if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' }))
                      }}
                      className="data-[state=checked]:bg-[#48805b] data-[state=checked]:border-[#48805b] mt-0.5"
                    />
                    <Label htmlFor="reg-terms" className="text-xs text-[#88837b] cursor-pointer leading-relaxed">
                      I agree to the{' '}
                      <span className="text-[#48805b] font-medium">Terms of Service</span> and{' '}
                      <span className="text-[#48805b] font-medium">Privacy Policy</span>
                    </Label>
                  </div>
                  {fieldErrors.terms && <p className="text-xs text-red-500">{fieldErrors.terms}</p>}
                </div>

                {/* Create Account button */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="h-11 border-[#e3dfd8] text-[#88837b] hover:bg-[#e3dfd8]/50 font-heading font-semibold rounded-xl min-h-[44px]"
                    onClick={() => {
                      setStep('contact')
                      setContactInput('')
                      setContactType('unknown')
                      setError(null)
                      setOtpId(null)
                      setOtpCode('')
                      setName('')
                      setPassword('')
                      setTermsAccepted(false)
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={registering}
                    className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                  >
                    {registering ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="justify-center pb-6">
                <p className="text-sm text-[#88837b]">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigateTo('auth-login')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Login
                  </button>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Optional Profile ── */}
        {step === 'profile' && (
          <motion.div
            key="profile-step"
            initial="hidden"
            animate="visible"
            variants={slideInRight}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-3">
                  <User className="w-7 h-7 text-[#48805b]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
                  Complete Your Profile
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  Optional details to personalize your experience
                </CardDescription>
                {renderStepIndicator()}
              </CardHeader>

              <CardContent className="space-y-3 pt-4">
                {/* Age and Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1f1e1c]">
                      Age <span className="text-[#88837b]">(optional)</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="h-11 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                      min={1}
                      max={120}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[#1f1e1c]">
                      Gender <span className="text-[#88837b]">(optional)</span>
                    </Label>
                    <Select
                      value={gender}
                      onValueChange={(v) => setGender(v)}
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
                  <Label className="text-xs font-medium text-[#1f1e1c]">
                    State <span className="text-[#88837b]">(optional)</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    <Select
                      value={state}
                      onValueChange={(v) => setState(v)}
                    >
                      <SelectTrigger className="h-11 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20 w-full">
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save & Continue / Skip buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSkipProfile}
                    variant="outline"
                    className="h-11 border-[#e3dfd8] text-[#88837b] hover:bg-[#e3dfd8]/50 font-heading font-semibold rounded-xl min-h-[44px]"
                  >
                    Skip & Continue
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updatingProfile}
                    className="flex-1 h-11 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                  >
                    {updatingProfile ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save & Continue'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Success Screen ── */}
        {step === 'success' && (
          <motion.div
            key="success-step"
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="w-full max-w-md"
          >
            <Card className="border-[#48805b]/30 shadow-xl">
              <CardContent className="flex flex-col items-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-[#48805b]/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-[#48805b]" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-heading text-2xl font-bold text-[#1f1e1c]"
                >
                  Welcome!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[#88837b] mt-2 text-sm"
                >
                  Redirecting you now...
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// FORGOT PASSWORD VIEW (Multi-step — mostly preserved)
// ============================================================
export function AuthForgotPassword() {
  const { navigateTo, user, goBack } = useAppStore()

  // ── Redirect if already logged in ──
  useEffect(() => {
    if (user) {
      navigateTo('landing')
    }
  }, [user, navigateTo])

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

      if (data.otp_id) {
        setOtpId(data.otp_id)
      }
      // OTP is sent via email to the user — never expose it in the UI

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
      {/* Back button */}
      <button
        onClick={goBack}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-[#88837b] hover:text-[#1f1e1c] text-sm font-medium transition-colors min-h-[44px] px-3 py-2 rounded-lg hover:bg-[#e3dfd8]/50"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
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
                          <InputOTPSlot index={0} className={otpSlotClass} />
                          <InputOTPSlot index={1} className={otpSlotClass} />
                          <InputOTPSlot index={2} className={otpSlotClass} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className={otpSlotClass} />
                          <InputOTPSlot index={4} className={otpSlotClass} />
                          <InputOTPSlot index={5} className={otpSlotClass} />
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
