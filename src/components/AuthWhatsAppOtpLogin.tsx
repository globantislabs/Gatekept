'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Phone, ArrowLeft, RefreshCw, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import type { UserProfile } from '@/lib/data-service'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { toast } from 'sonner'

// ─── Brand Constants ──────────────────────────────────────
const BRAND = {
  whatsappGreen: '#25D366',
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
}

// ─── Animation ────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

// ─── Constants ────────────────────────────────────────────
const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 30

// ============================================================
// WHATSAPP OTP LOGIN COMPONENT
// ============================================================
export function AuthWhatsAppOtpLogin() {
  const { navigateTo, setUser, redirectAfterLogin, setRedirectAfterLogin } = useAppStore()

  // Step management
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone')

  // Step 1: Phone input
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [phoneMasked, setPhoneMasked] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Step 2: OTP verification
  const [otpValue, setOtpValue] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 3: Login after OTP verified
  const [loggingIn, setLoggingIn] = useState(false)

  // ── Countdown timer ──
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

  // ── Send WhatsApp OTP ──
  const handleSendOtp = async () => {
    setError(null)
    const trimmedPhone = phone.trim()

    if (!trimmedPhone) {
      setError('Please enter your phone number')
      return
    }

    // Validate Indian phone: must be 10 digits (or with 91 prefix)
    const digits = trimmedPhone.replace(/\D/g, '')
    let localDigits = digits
    if (localDigits.startsWith('91') && localDigits.length === 12) {
      localDigits = localDigits.slice(2)
    }
    if (localDigits.startsWith('0') && localDigits.length === 11) {
      localDigits = localDigits.slice(1)
    }
    if (localDigits.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/auth/whatsapp-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, purpose: 'WHATSAPP_LOGIN' }),
      })

      const data = await res.json()

      if (!data.success && res.status >= 400) {
        setError(data.message || 'Failed to send OTP')
        setSending(false)
        return
      }

      setOtpId(data.otp_id)
      setPhoneMasked(data.phone_masked)
      setStep('otp')
      setSending(false)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setOtpValue('')
      setOtpError(null)
      setAttemptsRemaining(3)

      toast.success(`WhatsApp OTP sent to ${data.phone_masked}`)

      // In dev mode, show OTP code for testing
      if (data.message && data.message.includes('dev mode')) {
        const code = data.message.match(/code is (\d+)/)?.[1]
        if (code) {
          console.log(`[DEV] OTP code for testing: ${code}`)
          toast.info(`[DEV] OTP: ${code}`, { duration: 10000 })
        }
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
      setSending(false)
    }
  }

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendCooldown > 0) return
    setOtpValue('')
    setOtpError(null)
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    await handleSendOtp()
  }

  // ── Verify OTP ──
  const handleVerifyOtp = async () => {
    if (otpValue.length !== OTP_LENGTH || !otpId) return

    setVerifying(true)
    setOtpError(null)

    try {
      const res = await fetch('/api/auth/whatsapp-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp_id: otpId, otp_code: otpValue }),
      })

      const data = await res.json()

      if (data.success) {
        // OTP verified — now login
        await handleLogin()
      } else {
        setVerifying(false)
        setOtpError(data.message || 'Verification failed')
        setAttemptsRemaining(prev => Math.max(0, prev - 1))

        // If OTP expired or max attempts, go back to phone step
        if (data.message?.includes('expired') || data.message?.includes('Maximum')) {
          setOtpId(null)
          // Don't go back immediately, let user see the error and resend
        }
      }
    } catch (err: any) {
      setVerifying(false)
      setOtpError('Something went wrong. Please try again.')
    }
  }

  // ── Login with verified OTP ──
  const handleLogin = async () => {
    setLoggingIn(true)

    try {
      const res = await fetch('/api/auth/whatsapp-otp/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp_id: otpId,
          phone: phone.trim(),
          name: name.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setUser(data.user as UserProfile)
        setStep('success')
        toast.success(data.is_new
          ? `Welcome, ${data.user.name}! Your account has been created.`
          : `Welcome back, ${data.user.name}!`
        )
      } else {
        setVerifying(false)
        setLoggingIn(false)
        setOtpError(data.message || 'Login failed')
      }
    } catch (err: any) {
      setVerifying(false)
      setLoggingIn(false)
      setOtpError('Login failed. Please try again.')
    }
  }

  // ── Render Step ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f3f0] pt-20 pb-12 px-4">
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div
            key="phone-step"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="w-full max-w-md"
          >
            <Card className="border-[#e3dfd8] shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-7 h-7 text-[#25D366]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
                  WhatsApp OTP Login
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  Verify your phone number with a WhatsApp message
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

                {/* Name input (optional) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1f1e1c]">
                    Name <span className="text-[#88837b]">(optional)</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    <Input
                      type="text"
                      placeholder="Your name (for new accounts)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 pl-10 border-[#e3dfd8] focus:border-[#25D366] focus:ring-[#25D366]/20"
                    />
                  </div>
                </div>

                {/* Phone input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1f1e1c]">
                    Phone Number <span className="text-[#25D366]">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88837b]" />
                    <Input
                      type="tel"
                      placeholder="10-digit mobile number (e.g. 9876543210)"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError(null) }}
                      className="h-12 pl-10 border-[#e3dfd8] focus:border-[#25D366] focus:ring-[#25D366]/20"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-xs text-[#88837b]">
                    We&apos;ll send a 6-digit OTP to your WhatsApp number (+91 prefix added automatically)
                  </p>
                </div>

                {/* Send OTP button */}
                <Button
                  onClick={handleSendOtp}
                  disabled={sending}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20b85a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending WhatsApp OTP...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Send WhatsApp OTP
                    </span>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pb-6">
                <div className="flex gap-4 text-sm text-[#88837b]">
                  <button
                    onClick={() => navigateTo('auth-login')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Login with password
                  </button>
                  <span className="text-[#e3dfd8]">|</span>
                  <button
                    onClick={() => navigateTo('auth-register')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Register instead
                  </button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}

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
                <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-7 h-7 text-[#25D366]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1f1e1c]">
                  Enter OTP
                </CardTitle>
                <CardDescription className="text-[#88837b]">
                  We sent a 6-digit code to <span className="font-semibold text-[#1f1e1c]">{phoneMasked}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* OTP Error display */}
                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </motion.div>
                )}

                {/* OTP Entry */}
                <div className="flex flex-col items-center gap-2">
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={verifying || loggingIn}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg border-[#e3dfd8] data-[active=true]:border-[#25D366] data-[active=true]:ring-[#25D366]/20" />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-[#88837b]">
                    {attemptsRemaining > 0
                      ? `${attemptsRemaining} verification attempts remaining`
                      : 'No attempts remaining — please resend OTP'}
                  </p>
                </div>

                {/* Verify & Login button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpValue.length !== OTP_LENGTH || verifying || loggingIn}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20b85a] text-white font-heading font-semibold text-base rounded-xl transition-all min-h-[44px]"
                >
                  {verifying || loggingIn ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {verifying ? 'Verifying...' : 'Logging in...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Verify & Login
                    </span>
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendCooldown > 0
                    ? <p className="text-xs text-[#88837b]">Resend available in {resendCooldown}s</p>
                    : <Button
                        onClick={handleResend}
                        variant="ghost"
                        className="text-[#25D366] text-sm min-h-[44px]"
                        disabled={sending}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" /> Resend WhatsApp OTP
                      </Button>}
                </div>

                {/* Back button */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    className="text-[#88837b] text-sm min-h-[44px]"
                    onClick={() => {
                      setStep('phone')
                      setOtpValue('')
                      setOtpError(null)
                      setOtpId(null)
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Change phone number
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pb-6">
                <div className="flex gap-4 text-sm text-[#88837b]">
                  <button
                    onClick={() => navigateTo('auth-login')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Login with password
                  </button>
                  <span className="text-[#e3dfd8]">|</span>
                  <button
                    onClick={() => navigateTo('auth-register')}
                    className="text-[#48805b] font-semibold hover:underline focus:underline min-h-[44px] inline-flex items-center"
                  >
                    Register instead
                  </button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success-step"
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="w-full max-w-md"
          >
            <Card className="border-[#25D366]/30 shadow-xl">
              <CardContent className="flex flex-col items-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-[#25D366]" />
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
