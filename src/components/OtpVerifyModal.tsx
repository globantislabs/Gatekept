'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Phone, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { otpService } from '@/lib/data-service'
import type { OtpPurpose } from '@/lib/data-service'
import { toast } from 'sonner'

// ─── Props ──────────────────────────────────────────────────
interface OtpVerifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  purpose: OtpPurpose
  referenceId?: string
  purposeLabel: string
  onVerified: (otpVerifiedId: string) => void
}

// ─── Constants ──────────────────────────────────────────────
const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 30

export function OtpVerifyModal({
  open,
  onOpenChange,
  userId,
  purpose,
  referenceId,
  purposeLabel,
  onVerified,
}: OtpVerifyModalProps) {
  const [otpValue, setOtpValue] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [phoneMasked, setPhoneMasked] = useState('')
  const [sending, setSending] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)

  // ── Countdown timer ──
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // ── Send OTP (triggered by button click, not effect) ──
  const handleSendOtp = async () => {
    setSending(true)
    setErrorState(null)
    setErrorMessage('')
    try {
      const result = await otpService.send(userId, purpose, referenceId)
      setOtpId(result.otp_id)
      setPhoneMasked(result.phone_masked)
      setSending(false)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setAttemptsRemaining(3)
      toast.success(`OTP sent to ${result.phone_masked}`)
      // OTP is sent via SMS to the user's phone — never expose it in the UI
    } catch (err: any) {
      setSending(false)
      setErrorState(err.message || 'Failed to send OTP. Please ensure you have a registered phone number.')
    }
  }

  // ── Auto-send on mount ── (using a ref pattern to avoid lint issue)
  const [hasSent, setHasSent] = useState(false)
  // Send OTP once when modal opens - using state-driven approach
  if (open && !hasSent && !otpId) {
    setHasSent(true)
    // We'll trigger the send via a "sending" initial state
    // and the user sees a "Send OTP" button or auto-trigger
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setOtpValue('')
    await handleSendOtp()
  }

  const handleVerify = async () => {
    if (otpValue.length !== OTP_LENGTH || !otpId) return
    setVerifying(true)
    try {
      const result = await otpService.verify(otpId, otpValue)
      if (result.success) {
        setVerified(true)
        toast.success('OTP verified successfully!')
        setTimeout(() => {
          onVerified(otpId)
          onOpenChange(false)
        }, 800)
      } else {
        setVerifying(false)
        setErrorMessage(result.message)
        setAttemptsRemaining(prev => Math.max(0, prev - 1))
        if (result.message.includes('Maximum') || result.message.includes('expired')) {
          setOtpId(null)
          setHasSent(false)
        }
      }
    } catch (err: any) {
      setVerifying(false)
      setErrorMessage(err.message || 'Verification failed')
    }
  }

  // ── Reset on close ──
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setOtpValue('')
      setOtpId(null)
      setPhoneMasked('')
      setSending(true)
      setVerifying(false)
      setVerified(false)
      setErrorState(null)
      setErrorMessage('')
      setResendCooldown(0)
      setAttemptsRemaining(3)
      setHasSent(false)
    }
    onOpenChange(isOpen)
  }

  // ── Determine step ──
  const step = errorState
    ? 'error'
    : sending
      ? 'sending'
      : verified
        ? 'success'
        : verifying
          ? 'verifying'
          : 'input'

  // ── Shared Content ──
  const modalContent = (
    <div className="space-y-5">
      {/* Error state */}
      {step === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{errorState}</p>
            <Button onClick={handleSendOtp} variant="outline" className="mt-2 border-red-200 text-red-600 min-h-[44px]">
              <RefreshCw className="w-4 h-4 mr-1" /> Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Sending spinner + auto-send trigger */}
      {step === 'sending' && (
        <div className="flex flex-col items-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-[#48805b]" />
          <p className="mt-3 text-sm text-[#88837b]">Preparing OTP verification...</p>
          <Button
            onClick={handleSendOtp}
            className="mt-4 bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px]"
          >
            <Phone className="w-4 h-4 mr-2" /> Send OTP to My Phone
          </Button>
        </div>
      )}

      {/* OTP Input */}
      {step === 'input' || step === 'verifying' ? (
        <div className="space-y-4">
          {/* Purpose & Phone display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#48805b]/10 border border-[#48805b]/20">
            <Shield className="w-5 h-5 text-[#48805b]" />
            <div>
              <p className="text-sm font-semibold text-[#48805b]">{purposeLabel}</p>
              <p className="text-xs text-[#88837b]">
                <Phone className="w-3 h-3 inline mr-1" /> OTP sent to {phoneMasked}
              </p>
            </div>
          </div>

          {/* OTP Entry */}
          <div className="flex flex-col items-center gap-2">
            <InputOTP
              maxLength={OTP_LENGTH}
              value={otpValue}
              onChange={setOtpValue}
              disabled={verifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-[#88837b]">
              {attemptsRemaining > 0
                ? `${attemptsRemaining} verification attempts remaining`
                : 'No attempts remaining — please resend OTP'}
            </p>
          </div>

          {/* Error message */}
          {errorMessage && !verifying && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
            </div>
          )}

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={otpValue.length !== OTP_LENGTH || verifying}
            className="w-full bg-[#48805b] hover:bg-[#3a6a4a] text-white font-heading font-semibold min-h-[44px]"
          >
            {verifying
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span>
              : <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Verify OTP</span>}
          </Button>

          {/* Resend */}
          <div className="text-center">
            {resendCooldown > 0
              ? <p className="text-xs text-[#88837b]">Resend OTP available in {resendCooldown}s</p>
              : <Button onClick={handleResend} variant="ghost" className="text-[#48805b] text-sm min-h-[44px]">
                  <RefreshCw className="w-4 h-4 mr-1" /> Resend OTP
                </Button>}
          </div>
        </div>
      ) : null}

      {/* Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center py-6">
          <CheckCircle className="w-10 h-10 text-[#48805b]" />
          <p className="mt-3 text-sm font-semibold text-[#48805b]">Verified! Processing your request...</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop: Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-[#e3dfd8] hidden md:block">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#48805b]" /> Verify with OTP
            </DialogTitle>
            <DialogDescription className="text-[#88837b]">
              Confirm your action by entering the OTP sent to your phone
            </DialogDescription>
          </DialogHeader>
          {modalContent}
        </DialogContent>
      </Dialog>

      {/* Mobile: Sheet */}
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl border-[#e3dfd8]">
          <SheetHeader>
            <SheetTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#48805b]" /> Verify with OTP
            </SheetTitle>
            <SheetDescription className="text-[#88837b]">
              Confirm your action by entering the OTP sent to your phone
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pt-4 pb-6">{modalContent}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}
