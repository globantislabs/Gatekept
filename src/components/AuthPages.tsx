'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Lock, User, MapPin, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { authService } from '@/lib/data-service'
import type { UserProfile } from '@/lib/data-service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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

// ============================================================
// LOGIN VIEW
// ============================================================
export function AuthLogin() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin } = useAppStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

      // Redirect to saved destination or landing
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
            <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7 text-[#48805b]" />
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
              <Label className="text-sm font-medium text-[#1f1e1c]">
                Password
              </Label>
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
        </Card>
      </motion.div>
    </div>
  )
}

// ============================================================
// REGISTER VIEW
// ============================================================
export function AuthRegister() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin } = useAppStore()
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleRegister = async () => {
    setError(null)

    // Validation
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Email or phone is required')
      return
    }
    if (!form.password) {
      setError('Password is required')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (form.email.trim() && !form.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

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

      // Redirect to saved destination or landing
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
            <div className="w-14 h-14 rounded-full bg-[#48805b]/10 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7 text-[#48805b]" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
              Create Account
            </CardTitle>
            <CardDescription className="text-[#88837b]">
              Join the NotJust wellness movement
            </CardDescription>
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
                  className="h-11 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                />
              </div>
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
                    className="h-11 pl-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
                    autoComplete="email"
                  />
                </div>
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
                  className="h-11 pl-10 pr-10 border-[#e3dfd8] focus:border-[#48805b] focus:ring-[#48805b]/20"
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
            </div>

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

            {/* Register button */}
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-12 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold text-base rounded-xl transition-all mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Register'
              )}
            </Button>
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
