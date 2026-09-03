'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, CheckCircle, Lock, ArrowRight, ArrowLeft, RefreshCw,
  AlertCircle, ChevronRight, Trophy, Video, FileQuestion, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import SiteFooter from '@/components/SiteFooter'
import { productVideoService, productQuizService, productLearningService, productService, productServiceCompat, productVideoServiceCompat, productLearningServiceCompat } from '@/lib/data-service'
import type { ProductVideo, ProductQuiz, ProductLearningProgress, Product } from '@/lib/data-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ─── Brand Constants ───────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
} as const

// Dynamic pass threshold: 80% of questions (min 1)
function getPassThreshold(totalQuestions: number): number {
  return Math.max(1, Math.ceil(totalQuestions * 0.8))
}

// ─── Step Types ────────────────────────────────────────────
type LearningStep =
  | { type: 'video'; videoIndex: number }
  | { type: 'quiz'; videoIndex: number }
  | { type: 'completed' }

// ─── Animation Helpers ─────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
}

// ─── Quiz result for a specific video ──────────────────────
interface QuizResult {
  correct: number
  total: number
  passed: boolean
  answers: Record<number, number>
}

// ═══════════════════════════════════════════════════════════
// ProductLearningModule — Unified sequential learning flow
// Video 1 → Quiz 1 → Video 2 → Quiz 2 → Video 3 → Quiz 3 → Unlocked
// ═══════════════════════════════════════════════════════════
export function ProductLearningModule() {
  const { selectedProductId, user, navigateTo, setRedirectAfterLogin, setSelectedProductId, markProductCompleted } = useAppStore()

  // ─── Login guard: redirect to login if not authenticated ──
  useEffect(() => {
    if (!user) {
      setRedirectAfterLogin('product-detail')
      navigateTo('auth-login')
    }
  }, [user, navigateTo, setRedirectAfterLogin])

  // ─── Data state ───────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null)
  const [videos, setVideos] = useState<ProductVideo[]>([])
  const [progress, setProgress] = useState<ProductLearningProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Learning step state ──────────────────────────────
  const [currentStep, setCurrentStep] = useState<LearningStep>({ type: 'video', videoIndex: 0 })
  const [passedQuizzes, setPassedQuizzes] = useState<Record<number, boolean>>({})

  // ─── Video player state ───────────────────────────────
  const [playing, setPlaying] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0) // 0-100 for current video
  const [videoError, setVideoError] = useState(false) // true when video fails to load
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // ─── Quiz state ───────────────────────────────────────
  const [quizQuestions, setQuizQuestions] = useState<ProductQuiz[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Review mode: product already COMPLETED — user is re-watching videos.
  // Playback is free, but saved progress/status must never be overwritten.
  const [reviewMode, setReviewMode] = useState(false)

  // ─── Derived ──────────────────────────────────────────
  const currentVideo = currentStep.type === 'video' || currentStep.type === 'quiz'
    ? videos[currentStep.videoIndex] || null
    : null
  const hasRealVideo = currentVideo?.video_url && currentVideo.video_url.trim() !== ''

  // ─── Build the step list for the progress indicator ───
  const stepList: { type: 'video' | 'quiz'; videoIndex: number; label: string }[] = []
  for (let i = 0; i < videos.length; i++) {
    stepList.push({ type: 'video', videoIndex: i, label: `Video ${i + 1}` })
    stepList.push({ type: 'quiz', videoIndex: i, label: `Quiz ${i + 1}` })
  }
  const currentStepIndex = stepList.findIndex((s) => {
    if (currentStep.type === 'completed') return false
    return s.type === currentStep.type && s.videoIndex === currentStep.videoIndex
  })

  // ─── Fetch data ───────────────────────────────────────
  useEffect(() => {
    if (!selectedProductId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      // Reset per-product state to avoid cross-product contamination
      setPassedQuizzes({})
      setCurrentStep({ type: 'video', videoIndex: 0 })
      setVideoError(false)
      setProgress(null)
      setReviewMode(false)
      try {
        const [prodRes, vidRes, progRes] = await Promise.all([
          productServiceCompat.getById(selectedProductId),
          productVideoServiceCompat.getByProduct(selectedProductId),
          user
            ? productLearningServiceCompat.getProgress(user.id, selectedProductId)
            : Promise.resolve({ data: null, error: null }),
        ])
        if (cancelled) return
        setProduct(prodRes.data || null)
        // Only show active videos
        const loadedVideos = (vidRes.data || []).filter(v => v.active !== false)
        setVideos(loadedVideos)
        // progRes.data can be an array or single object — extract single object
        const progData = progRes.data
        let savedProgressObj: ProductLearningProgress | null = null
        if (Array.isArray(progData)) {
          savedProgressObj = progData.length > 0 ? progData[0] : null
        } else if (progData && typeof progData === 'object') {
          savedProgressObj = progData as ProductLearningProgress
        }
        setProgress(savedProgressObj)

        // Get quizzes from product data for reconstructing passed state
        const productQuizzes = (prodRes.data as (Product & { quizzes?: ProductQuiz[] }) | null)?.quizzes || []

        // Determine which step to start on based on saved progress
        if (savedProgressObj && loadedVideos.length > 0) {
          const savedProgress = savedProgressObj
          // Check quiz_answers to see which quizzes were already passed
          // We'll reconstruct the step from the progress
          const vp = savedProgress.video_progress || {}
          const qa = savedProgress.quiz_answers || {}

          // If the status is already COMPLETED, enter REVIEW mode —
          // start from Video 1 so the user can re-watch everything freely.
          // Saved progress and status are never overwritten in review mode.
          if (savedProgress.status === 'COMPLETED') {
            const allPassed: Record<number, boolean> = {}
            for (let i = 0; i < loadedVideos.length; i++) {
              allPassed[i] = true
            }
            setPassedQuizzes(allPassed)
            setReviewMode(true)
            setCurrentStep({ type: 'video', videoIndex: 0 })
          } else {
            // Reconstruct passedQuizzes from saved quiz answers for this product only
            const reconstructedPassed: Record<number, boolean> = {}
            for (let vi = 0; vi < loadedVideos.length; vi++) {
              const videoId = loadedVideos[vi].id
              // Get quizzes for this video
              const videoQuizzes = productQuizzes.filter(
                q => q.video_id === videoId && q.active !== false
              )
              if (videoQuizzes.length === 0) continue
              // Check if all answers for this video's quizzes are saved and correct
              const videoQA = qa as Record<string, number>
              let correctCount = 0
              let answeredCount = 0
              for (const quiz of videoQuizzes) {
                const userAnswer = videoQA[quiz.id]
                if (userAnswer !== undefined && userAnswer !== -1) {
                  answeredCount++
                  if (userAnswer === quiz.answer) {
                    correctCount++
                  }
                }
              }
              // Quiz is passed if enough questions answered correctly (80% threshold)
              const passThreshold = getPassThreshold(videoQuizzes.length)
              if (answeredCount === videoQuizzes.length && correctCount >= passThreshold) {
                reconstructedPassed[vi] = true
              }
            }
            setPassedQuizzes(reconstructedPassed)

            // Find the first video that is not 100% complete or whose quiz is not passed
            let startVideoIdx = 0
            for (let i = 0; i < loadedVideos.length; i++) {
              const vidProg = vp[loadedVideos[i].id] ?? 0
              if (vidProg < 100) {
                startVideoIdx = i
                break
              }
              // Video is complete but quiz not passed — go back to quiz
              if (!reconstructedPassed[i]) {
                startVideoIdx = i
                break
              }
              if (i === loadedVideos.length - 1) {
                startVideoIdx = loadedVideos.length - 1
              }
            }

            // Start on the appropriate video
            setCurrentStep({ type: 'video', videoIndex: startVideoIdx })
          }
        }
      } catch (err) {
        console.error('Failed to load learning data:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedProductId, user])

  // ─── Reset video player when step changes ─────────────
  useEffect(() => {
    setPlaying(false)
    setVideoError(false)
    setQuizResult(null)
    setAnswers({})
    setCurrentQuestionIdx(0)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // Set video progress from saved data (review mode always starts at 0)
    if (currentStep.type === 'video' && currentVideo) {
      const savedProg = reviewMode ? 0 : (progress?.video_progress?.[currentVideo.id] ?? 0)
      setVideoProgress(savedProg)
    } else {
      setVideoProgress(0)
    }
  }, [currentStep.type, currentStep.type === 'video' || currentStep.type === 'quiz' ? currentStep.videoIndex : null, currentVideo?.id, reviewMode])

  // ─── Fetch quiz questions when entering a quiz step ───
  useEffect(() => {
    if (currentStep.type !== 'quiz') return
    const video = videos[currentStep.videoIndex]
    if (!video) return

    let cancelled = false
    async function loadQuiz() {
      setQuizLoading(true)
      try {
        const res = await productQuizService.list(selectedProductId)
        if (!cancelled) {
          // Filter quizzes for this specific video, only active ones
          const filtered = res.filter(q => q.video_id === video.id && q.active !== false)
          setQuizQuestions(filtered)
        }
      } catch (err) {
        console.error('Failed to load quiz questions:', err)
      } finally {
        if (!cancelled) setQuizLoading(false)
      }
    }
    loadQuiz()
    return () => { cancelled = true }
  }, [currentStep.type === 'quiz' ? currentStep.videoIndex : -1, videos])

  // ─── Video playback (simulated fallback) ─────────────
  useEffect(() => {
    if (hasRealVideo) return // real video handles its own progress
    if (playing && videoProgress < 100) {
      progressIntervalRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          const next = Math.min(prev + 2, 100)
          if (next >= 100) {
            setPlaying(false)
          }
          return next
        })
      }, 150)
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [playing, hasRealVideo])

  // ─── Save video progress to backend ───────────────────
  const saveVideoProgress = useCallback(async (pct: number) => {
    if (reviewMode) return // review replays must not overwrite saved progress/status
    if (!selectedProductId || !currentVideo) return
    if (!user) return // Skip backend save if not logged in
    try {
      const updatedVP = { ...(progress?.video_progress || {}), [currentVideo.id]: pct }
      const saved = await productLearningService.save({
        user_id: user.id,
        product_id: selectedProductId,
        video_progress: updatedVP,
        quiz_answers: progress?.quiz_answers || {},
        quiz_completed: progress?.quiz_completed || false,
        quiz_score: progress?.quiz_score || 0,
        status: pct >= 100 ? 'IN_PROGRESS' : (progress?.status || 'IN_PROGRESS'),
      })
      if (saved) setProgress(saved)
    } catch (err) {
      console.error('Failed to save video progress:', err)
    }
  }, [user, selectedProductId, currentVideo, progress, reviewMode])

  // ─── Auto-save when video completes ───────────────────
  useEffect(() => {
    if (videoProgress >= 100 && currentStep.type === 'video' && currentVideo) {
      saveVideoProgress(100)
    }
  }, [videoProgress, currentStep.type, currentVideo?.id, saveVideoProgress])

  // ─── Video player handlers ────────────────────────────
  const handlePlayPause = () => {
    // Allow re-play: restart from 0% instead of blocking at 100%
    if (videoProgress >= 100) {
      setVideoProgress(0)
      setPlaying(true)
      return
    }
    setPlaying(!playing)
    if (playing) {
      saveVideoProgress(videoProgress)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    setVideoProgress(pct)
    saveVideoProgress(pct)
  }

  // ─── Advance to next step after video completes ───────
  const handleVideoComplete = () => {
    if (currentStep.type !== 'video') return
    // Move to quiz for this video
    setCurrentStep({ type: 'quiz', videoIndex: currentStep.videoIndex })
  }

  // ─── Handle answer selection ──────────────────────────
  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
  }

  // ─── Submit quiz ──────────────────────────────────────
  const handleSubmitQuiz = async () => {
    if (!selectedProductId) return
    setSubmitting(true)

    try {
      let correctCount = 0
      const quizAnswersMap: Record<string, number> = {}

      quizQuestions.forEach((quiz, idx) => {
        const userAnswer = answers[idx]
        quizAnswersMap[quiz.id] = userAnswer ?? -1
        if (userAnswer === quiz.answer) {
          correctCount++
        }
      })

      const totalQuestions = quizQuestions.length
      const passThreshold = getPassThreshold(totalQuestions)
      const passed = correctCount >= passThreshold

      const result: QuizResult = {
        correct: correctCount,
        total: totalQuestions,
        passed,
        answers: { ...answers },
      }
      setQuizResult(result)

      // Save progress via service (only if logged in and NOT in review mode —
      // review replays must not downgrade the COMPLETED status)
      if (user && !reviewMode) {
        const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
        try {
          const existingVP = progress?.video_progress || {}
          const existingQA = progress?.quiz_answers || {}
          const updatedQA = { ...existingQA, ...quizAnswersMap }

          // Determine new status
          let newStatus = 'IN_PROGRESS'
          let allQuizzesCompleted = false
          if (passed && currentStep.type === 'quiz') {
            const nextVideoIndex = currentStep.videoIndex + 1
            if (nextVideoIndex >= videos.length) {
              newStatus = 'COMPLETED'
              allQuizzesCompleted = true
            }
          }

          const saved = await productLearningService.save({
            user_id: user.id,
            product_id: selectedProductId,
            video_progress: existingVP,
            quiz_answers: updatedQA,
            quiz_completed: allQuizzesCompleted,
            quiz_score: overallScore,
            status: newStatus,
          })
          if (saved) setProgress(saved)
        } catch (err) {
          console.error('Failed to save quiz progress:', err)
        }
      }

      if (passed) {
        const isFinalQuiz = currentStep.type === 'quiz' && currentStep.videoIndex + 1 >= videos.length
        // Mark this quiz as passed
        setPassedQuizzes((prev) => ({
          ...prev,
          [currentStep.type === 'quiz' ? currentStep.videoIndex : -1]: true,
        }))
        if (isFinalQuiz && !reviewMode) {
          // Final quiz passed — status was already saved as COMPLETED above.
          // NO intermediate "Unlock Product" / "Product Unlocked!" screens:
          // go straight back to the product page, which now shows the unlocked state.
          toast.success('Learning complete! Product unlocked.')
          if (selectedProductId) markProductCompleted(selectedProductId)
          navigateTo('product-detail')
          return
        }
        toast.success('Quiz passed! Moving to the next lesson.')
      } else {
        toast.error(`You got ${correctCount}/${totalQuestions} correct. You need ${passThreshold} to pass. Please re-watch the video and try again.`)
      }
    } catch (err) {
      console.error('Quiz submit failed:', err)
      toast.error('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Advance after passing quiz ───────────────────────
  const handleQuizPassContinue = () => {
    if (currentStep.type !== 'quiz') return
    const nextVideoIndex = currentStep.videoIndex + 1
    if (nextVideoIndex < videos.length) {
      setCurrentStep({ type: 'video', videoIndex: nextVideoIndex })
    } else {
      // All steps done (e.g. review-mode replay of the last quiz) — no intermediate
      // "unlock" screens; return straight to the product page (already unlocked)
      if (selectedProductId) markProductCompleted(selectedProductId)
      navigateTo('product-detail')
    }
  }

  // ─── Retry after failing quiz ─────────────────────────
  const handleRetryQuiz = () => {
    if (currentStep.type !== 'quiz') return
    // Go back to the video for this quiz
    setCurrentStep({ type: 'video', videoIndex: currentStep.videoIndex })
  }

  // ─── Check if a step is unlocked ──────────────────────
  const isStepUnlocked = (step: { type: 'video' | 'quiz'; videoIndex: number }): boolean => {
    // Step 0 (Video 1) is always unlocked
    if (step.videoIndex === 0 && step.type === 'video') return true
    // Quiz for video 0 is unlocked if video 0 is 100% complete
    if (step.videoIndex === 0 && step.type === 'quiz') {
      return (progress?.video_progress?.[videos[0]?.id] ?? 0) >= 100
    }
    // Video N is unlocked if quiz for video N-1 is passed
    if (step.type === 'video' && step.videoIndex > 0) {
      return !!passedQuizzes[step.videoIndex - 1]
    }
    // Quiz N is unlocked if video N is 100% complete
    if (step.type === 'quiz' && step.videoIndex > 0) {
      const videoComplete = (progress?.video_progress?.[videos[step.videoIndex]?.id] ?? 0) >= 100
      const prevQuizPassed = !!passedQuizzes[step.videoIndex - 1]
      return videoComplete && prevQuizPassed
    }
    return false
  }

  // ─── Overall progress percentage ──────────────────────
  const totalSteps = videos.length * 2 // each video + quiz
  const completedSteps = Object.keys(passedQuizzes).filter((k) => passedQuizzes[Number(k)]).length * 2
    + videos.filter((v) => (progress?.video_progress?.[v.id] ?? 0) >= 100 && !passedQuizzes[videos.indexOf(v)]).length
  const overallPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // ─── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: BRAND.green }} />
          <p className="text-sm" style={{ color: BRAND.muted }}>Loading learning content...</p>
        </div>
      </div>
    )
  }

  if (!product || videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full" style={{ borderColor: BRAND.surface }}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: BRAND.muted }} />
            <p className="font-heading text-lg" style={{ color: BRAND.dark }}>No learning content available</p>
            <p className="text-sm mt-1" style={{ color: BRAND.muted }}>This product doesn't have learning videos yet.</p>
            <Button
              className="mt-4"
              style={{ backgroundColor: BRAND.green, color: '#fff' }}
              onClick={() => { setSelectedProductId(null); navigateTo('products') }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  // Don't render content until authenticated (prevents flash)
  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BRAND.bg }}>
    <motion.div {...fadeInUp} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto px-4 py-6 flex-1">
      {/* ─── Header ────────────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedProductId(null); navigateTo('products') }}
          className="p-2 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: BRAND.dark }} />
        </Button>
        <div className="flex-1 min-w-[140px]">
          <h1 className="font-heading text-lg sm:text-2xl font-bold break-words" style={{ color: BRAND.dark }}>
            Learn: {product.name}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: BRAND.muted }}>
            Complete each video and quiz to unlock this product
          </p>
        </div>
        <Badge
          style={{
            backgroundColor: currentStep.type === 'completed' ? BRAND.lime : BRAND.surface,
            color: currentStep.type === 'completed' ? BRAND.dark : BRAND.muted,
          }}
          className="text-[10px] sm:text-xs font-medium shrink-0"
        >
          {currentStep.type === 'completed' ? 'Unlocked' : reviewMode ? 'Review Mode' : overallPct > 0 ? `${overallPct}% Progress` : 'Getting started'}
        </Badge>
      </div>

      {/* ─── Step Progress Indicator ───────────────────── */}
      <Card className="mb-6" style={{ borderColor: BRAND.surface }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            {stepList.map((step, idx) => {
              const isCurrent =
                currentStep.type !== 'completed' &&
                step.type === currentStep.type &&
                step.videoIndex === currentStep.videoIndex
              const isPast = idx < currentStepIndex || currentStep.type === 'completed'
              const isUnlocked = isStepUnlocked(step)
              const isQuizPassed = step.type === 'quiz' && !!passedQuizzes[step.videoIndex]
              const isVideoComplete =
                step.type === 'video' &&
                (progress?.video_progress?.[videos[step.videoIndex]?.id] ?? 0) >= 100

              // Determine icon and color
              let stepIcon: React.ReactNode
              let bgColor: string
              let iconColor: string
              let textColor: string

              if (isQuizPassed || (isPast && step.type === 'quiz')) {
                stepIcon = <CheckCircle className="h-4 w-4" />
                bgColor = BRAND.lime
                iconColor = BRAND.dark
                textColor = BRAND.dark
              } else if (isPast && step.type === 'video') {
                stepIcon = <CheckCircle className="h-4 w-4" />
                bgColor = BRAND.lime
                iconColor = BRAND.dark
                textColor = BRAND.dark
              } else if (isVideoComplete && step.type === 'video') {
                stepIcon = <CheckCircle className="h-4 w-4" />
                bgColor = BRAND.lime
                iconColor = BRAND.dark
                textColor = BRAND.dark
              } else if (isCurrent) {
                stepIcon =
                  step.type === 'video' ? (
                    <Play className="h-4 w-4" fill="white" />
                  ) : (
                    <FileQuestion className="h-4 w-4" />
                  )
                bgColor = BRAND.green
                iconColor = '#fff'
                textColor = BRAND.green
              } else if (isUnlocked) {
                stepIcon =
                  step.type === 'video' ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <FileQuestion className="h-4 w-4" />
                  )
                bgColor = `${BRAND.green}20`
                iconColor = BRAND.green
                textColor = BRAND.green
              } else {
                stepIcon = <Lock className="h-3.5 w-3.5" />
                bgColor = BRAND.surface
                iconColor = BRAND.muted
                textColor = BRAND.muted
              }

              return (
                <React.Fragment key={`${step.type}-${step.videoIndex}`}>
                  {idx > 0 && (
                    <div
                      className="h-0.5 flex-1 min-w-[8px] max-w-[32px] rounded-full"
                      style={{
                        backgroundColor:
                          isPast || isCurrent ? BRAND.lime : BRAND.surface,
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1 min-w-[48px] shrink-0 snap-start">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: bgColor, color: iconColor }}
                    >
                      {stepIcon}
                    </div>
                    <span
                      className="text-[10px] font-medium whitespace-nowrap"
                      style={{ color: textColor }}
                    >
                      {step.type === 'video' ? `V${step.videoIndex + 1}` : `Q${step.videoIndex + 1}`}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── Main Content Area ─────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ═══ VIDEO STEP ═══ */}
        {currentStep.type === 'video' && (
          <motion.div
            key={`video-${currentStep.videoIndex}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden" style={{ borderColor: BRAND.surface }}>
              {/* Video area */}
              {hasRealVideo && !videoError ? (
                /* ── Real video player ── */
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    src={currentVideo!.video_url?.startsWith('/uploads/') ? `/api${currentVideo!.video_url}` : currentVideo!.video_url}
                    className="w-full aspect-video"
                    controls
                    controlsList="nodownload"
                    playsInline
                    preload="metadata"
                    autoPlay={playing}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => {
                      setPlaying(false)
                      setVideoProgress(100)
                      saveVideoProgress(100)
                    }}
                    onTimeUpdate={() => {
                      const v = videoRef.current
                      if (v && v.duration > 0) {
                        const pct = Math.round((v.currentTime / v.duration) * 100)
                        setVideoProgress(pct)
                      }
                    }}
                    onLoadedMetadata={() => {
                      // Restore saved progress (never seek to the end in review mode)
                      if (!reviewMode && videoProgress > 0 && videoProgress < 100 && videoRef.current && videoRef.current.duration > 0) {
                        videoRef.current.currentTime = (videoProgress / 100) * videoRef.current.duration
                      }
                    }}
                    onError={(e) => {
                      console.error('[Video Player] Error loading video:', currentVideo!.video_url, e)
                      setVideoError(true)
                      setPlaying(false)
                    }}
                  />
                  {/* Video number badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="text-xs" style={{ backgroundColor: BRAND.green, color: '#fff' }}>
                      Video {currentStep.videoIndex + 1} of {videos.length}
                    </Badge>
                  </div>
                </div>
              ) : (
                /* ── Simulated video (fallback) or video error ── */
                <div
                  className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer"
                  onClick={videoError ? undefined : handlePlayPause}
                >
                  {/* Video error overlay */}
                  {videoError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
                      <AlertCircle className="h-12 w-12 mb-3" style={{ color: '#ef4444' }} />
                      <p className="text-white font-medium text-sm mb-1">Video unavailable</p>
                      <p className="text-white/60 text-xs mb-3">The video file could not be loaded</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setVideoError(false); setVideoProgress(100); saveVideoProgress(100); }}
                      >
                        Skip video & continue
                      </Button>
                    </div>
                  )}
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <div
                        className="text-9xl font-heading font-bold select-none"
                        style={{ color: BRAND.lime }}
                      >
                        {product?.name?.charAt(0) ?? '?'}
                      </div>
                    </div>
                  </div>

                  {/* Video info overlay */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge
                      className="text-xs"
                      style={{ backgroundColor: BRAND.green, color: '#fff' }}
                    >
                      Video {currentStep.videoIndex + 1} of {videos.length}
                    </Badge>
                  </div>

                  {/* Play/Pause button */}
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="z-10">
                    {videoProgress >= 100 ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-16 w-16" style={{ color: BRAND.lime }} />
                        <span className="text-sm font-medium" style={{ color: BRAND.lime }}>Video Complete</span>
                      </div>
                    ) : (
                      <div
                        className="h-16 w-16 rounded-full flex items-center justify-center backdrop-blur-sm"
                        style={{ backgroundColor: `${BRAND.green}CC` }}
                      >
                        {playing ? (
                          <div className="flex gap-1.5 items-center">
                            <div className="w-1.5 h-6 bg-white rounded-sm" />
                            <div className="w-1.5 h-6 bg-white rounded-sm" />
                          </div>
                        ) : (
                          <Play className="h-7 w-7 text-white ml-1" fill="white" />
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Duration badge */}
                  <div className="absolute bottom-4 right-4 z-10">
                    <span className="text-xs text-white/70 bg-black/40 px-2 py-1 rounded">
                      {currentVideo?.duration || '0:00'}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress bar (seek bar) — only for simulated video */}
              {!hasRealVideo && (
              <div
                className="h-1.5 cursor-pointer relative"
                style={{ backgroundColor: BRAND.surface }}
                onClick={handleSeek}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${videoProgress}%`,
                    backgroundColor: videoProgress >= 100 ? BRAND.lime : BRAND.green,
                  }}
                />
              </div>
              )}

              {/* Video title & controls */}
              <CardContent className="p-4">
                <h3 className="font-heading text-lg font-semibold" style={{ color: BRAND.dark }}>
                  {currentVideo?.title || 'Video'}
                </h3>
                <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                  {currentVideo?.description || ''}
                </p>

                <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: BRAND.green }}>
                      {videoProgress > 0 ? `${videoProgress}%` : 'Not started'}
                    </span>
                    <span className="text-sm" style={{ color: BRAND.muted }}>
                      {videoProgress > 0 ? 'watched' : ''}
                    </span>
                  </div>

                  {videoProgress >= 100 && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      style={{ backgroundColor: BRAND.green, color: '#fff' }}
                      onClick={handleVideoComplete}
                    >
                      Take Quiz {currentStep.videoIndex + 1} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instruction card */}
            <Card className="mt-4" style={{ borderColor: BRAND.surface, backgroundColor: `${BRAND.blue}08` }}>
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: BRAND.blue }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: BRAND.dark }}>
                    Watch the full video to unlock the quiz
                  </p>
                  <p className="text-xs mt-1" style={{ color: BRAND.muted }}>
                    You must watch the entire video before taking Quiz {currentStep.videoIndex + 1}.
                    You need {getPassThreshold(quizQuestions.length)} out of {quizQuestions.length} correct answers (80%) to pass.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ QUIZ STEP ═══ */}
        {currentStep.type === 'quiz' && (
          <motion.div
            key={`quiz-${currentStep.videoIndex}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {quizLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin" style={{ color: BRAND.green }} />
                  <p className="text-sm" style={{ color: BRAND.muted }}>Loading quiz questions...</p>
                </div>
              </div>
            ) : quizQuestions.length === 0 ? (
              <Card style={{ borderColor: BRAND.surface }}>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: BRAND.muted }} />
                  <p className="font-heading text-lg" style={{ color: BRAND.dark }}>No quiz questions available</p>
                  <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                    There are no quiz questions for this video yet.
                  </p>
                  <Button
                    className="mt-4"
                    style={{ backgroundColor: BRAND.green, color: '#fff' }}
                    onClick={handleQuizPassContinue}
                  >
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ) : reviewMode && passedQuizzes[currentStep.videoIndex] ? (
              /* ═══ REVIEW MODE — QUIZ ALREADY PASSED ═══ */
              <Card style={{ borderColor: BRAND.lime, backgroundColor: `${BRAND.lime}08` }}>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: BRAND.green }} />
                  <p className="font-heading text-lg" style={{ color: BRAND.dark }}>
                    Quiz {currentStep.videoIndex + 1} already passed
                  </p>
                  <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                    You are in review mode — your results are safe. Re-watch the videos as many times as you like.
                  </p>
                  <Button
                    className="mt-4"
                    style={{ backgroundColor: BRAND.green, color: '#fff' }}
                    onClick={handleQuizPassContinue}
                  >
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ) : quizResult ? (
              /* ═══ QUIZ RESULT ═══ */
              <Card
                className="border-2"
                style={{ borderColor: quizResult.passed ? BRAND.lime : BRAND.green }}
              >
                <CardHeader className="text-center pb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    {quizResult.passed ? (
                      <CheckCircle className="h-16 w-16 mx-auto" style={{ color: BRAND.lime }} />
                    ) : (
                      <AlertCircle className="h-16 w-16 mx-auto" style={{ color: BRAND.green }} />
                    )}
                  </motion.div>
                  <CardTitle className="font-heading text-2xl mt-3" style={{ color: BRAND.dark }}>
                    {quizResult.passed ? 'Quiz Passed!' : 'Not Quite!'}
                  </CardTitle>
                  <CardDescription style={{ color: BRAND.muted }}>
                    {quizResult.passed
                      ? `You scored ${quizResult.correct}/${quizResult.total} on Quiz ${currentStep.videoIndex + 1}`
                      : `You got ${quizResult.correct}/${quizResult.total} correct — you need ${getPassThreshold(quizResult.total)} to pass`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Score display */}
                  <div
                    className="text-center py-4 rounded-lg"
                    style={{
                      backgroundColor: quizResult.passed ? `${BRAND.lime}20` : `${BRAND.green}15`,
                    }}
                  >
                    <p
                      className="font-heading text-4xl font-bold"
                      style={{ color: quizResult.passed ? BRAND.lime : BRAND.green }}
                    >
                      {quizResult.correct}/{quizResult.total}
                    </p>
                    <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                      {quizResult.passed
                        ? quizResult.correct === quizResult.total
                          ? 'Perfect Score!'
                          : 'You passed!'
                        : `${getPassThreshold(quizResult.total) - quizResult.correct} more correct answer${getPassThreshold(quizResult.total) - quizResult.correct !== 1 ? 's' : ''} needed`}
                    </p>
                  </div>

                  {/* Review incorrect answers */}
                  {!quizResult.passed && (
                    <div className="space-y-3">
                      <h4 className="font-heading text-sm font-semibold" style={{ color: BRAND.dark }}>
                        Questions to Review
                      </h4>
                      {quizQuestions.map((quiz, idx) => {
                        const userAnswer = quizResult.answers[idx]
                        const isCorrect = userAnswer === quiz.answer
                        if (isCorrect) return null

                        return (
                          <motion.div
                            key={quiz.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="rounded-lg p-3"
                            style={{
                              backgroundColor: `${BRAND.green}10`,
                              borderLeft: `3px solid ${BRAND.green}`,
                            }}
                          >
                            <p className="text-sm font-medium" style={{ color: BRAND.dark }}>
                              {quiz.question}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${BRAND.green}20`, color: BRAND.green }}
                              >
                                Your answer: {userAnswer !== undefined ? quiz.options[userAnswer] : 'Not answered'}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${BRAND.lime}30`, color: BRAND.dark }}
                              >
                                Correct: {quiz.options[quiz.answer]}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-2">
                  {quizResult.passed ? (
                    <Button
                      className="flex-1 font-heading"
                      style={{ backgroundColor: BRAND.lime, color: BRAND.dark }}
                      onClick={handleQuizPassContinue}
                    >
                      {currentStep.videoIndex < videos.length - 1 ? (
                        <>
                          Continue to Video {currentStep.videoIndex + 2}{' '}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          {reviewMode ? 'Continue to Product' : 'Unlock Product'} <Trophy className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 font-heading"
                      style={{ backgroundColor: BRAND.blue, color: '#fff' }}
                      onClick={handleRetryQuiz}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Re-watch Video & Retry Quiz
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              /* ═══ QUIZ QUESTIONS ═══ */
              <>
                {/* Quiz header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h2 className="font-heading text-lg font-semibold" style={{ color: BRAND.dark }}>
                      Quiz {currentStep.videoIndex + 1}: {currentVideo?.title || `Video ${currentStep.videoIndex + 1}`}
                    </h2>
                    <p className="text-xs" style={{ color: BRAND.muted }}>
                      Answer all {quizQuestions.length} questions — need {getPassThreshold(quizQuestions.length)}/{quizQuestions.length} correct to pass
                    </p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-3 mb-6">
                  <Progress
                    value={
                      quizQuestions.length > 0
                        ? (Object.keys(answers).length / quizQuestions.length) * 100
                        : 0
                    }
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: BRAND.muted }}>
                    {Object.keys(answers).length}/{quizQuestions.length} answered
                  </span>
                </div>

                {/* Question navigation dots */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {quizQuestions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        idx === currentQuestionIdx ? 'scale-125' : ''
                      }`}
                      style={{
                        backgroundColor:
                          idx === currentQuestionIdx
                            ? BRAND.green
                            : answers[idx] !== undefined
                              ? BRAND.lime
                              : BRAND.surface,
                      }}
                      aria-label={`Go to question ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Current question card */}
                <AnimatePresence mode="wait">
                  {quizQuestions[currentQuestionIdx] && (
                    <motion.div
                      key={currentQuestionIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card style={{ borderColor: BRAND.surface }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge
                              className="text-xs"
                              style={{ backgroundColor: `${BRAND.green}20`, color: BRAND.green }}
                            >
                              Question {currentQuestionIdx + 1} of {quizQuestions.length}
                            </Badge>
                          </div>
                          <CardTitle
                            className="font-heading text-lg mt-3"
                            style={{ color: BRAND.dark }}
                          >
                            {quizQuestions[currentQuestionIdx].question}
                          </CardTitle>
                        </CardHeader>

                        <CardContent>
                          <RadioGroup
                            value={
                              answers[currentQuestionIdx] !== undefined
                                ? answers[currentQuestionIdx].toString()
                                : ''
                            }
                            onValueChange={(val) =>
                              handleAnswer(currentQuestionIdx, parseInt(val, 10))
                            }
                            className="space-y-3"
                          >
                            {quizQuestions[currentQuestionIdx].options.map((option, optIdx) => (
                              <motion.div
                                key={optIdx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15, delay: optIdx * 0.05 }}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  answers[currentQuestionIdx] === optIdx ? 'border-current' : ''
                                }`}
                                style={{
                                  borderColor:
                                    answers[currentQuestionIdx] === optIdx
                                      ? BRAND.green
                                      : BRAND.surface,
                                  backgroundColor:
                                    answers[currentQuestionIdx] === optIdx
                                      ? `${BRAND.green}10`
                                      : 'transparent',
                                }}
                                onClick={() => handleAnswer(currentQuestionIdx, optIdx)}
                              >
                                <RadioGroupItem
                                  value={optIdx.toString()}
                                  id={`q-${currentQuestionIdx}-${optIdx}`}
                                  style={{ color: BRAND.green }}
                                />
                                <Label
                                  htmlFor={`q-${currentQuestionIdx}-${optIdx}`}
                                  className="flex-1 cursor-pointer text-sm"
                                  style={{ color: BRAND.dark }}
                                >
                                  {option}
                                </Label>
                              </motion.div>
                            ))}
                          </RadioGroup>
                        </CardContent>

                        <CardFooter className="flex justify-between gap-2 flex-wrap p-6 pt-2">
                          <Button
                            variant="outline"
                            disabled={currentQuestionIdx === 0}
                            onClick={() =>
                              setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))
                            }
                            className="flex-1 sm:flex-none"
                            style={{ borderColor: BRAND.surface, color: BRAND.dark }}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>

                          {currentQuestionIdx < quizQuestions.length - 1 ? (
                            <Button
                              className="flex-1 sm:flex-none"
                              onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                              style={{ backgroundColor: BRAND.green, color: '#fff' }}
                            >
                              Next <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
                              className="flex-1 sm:flex-none"
                              onClick={handleSubmitQuiz}
                              disabled={
                                Object.keys(answers).length < quizQuestions.length || submitting
                              }
                              style={{
                                backgroundColor:
                                  Object.keys(answers).length < quizQuestions.length
                                    ? BRAND.surface
                                    : BRAND.green,
                                color:
                                  Object.keys(answers).length < quizQuestions.length
                                    ? BRAND.muted
                                    : '#fff',
                              }}
                            >
                              {submitting ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Submitting...
                                </>
                              ) : (
                                <>
                                  Submit Quiz <CheckCircle className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit hint */}
                {currentQuestionIdx === quizQuestions.length - 1 &&
                  Object.keys(answers).length < quizQuestions.length && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-xs mt-4"
                      style={{ color: BRAND.muted }}
                    >
                      Please answer all {quizQuestions.length} questions before submitting (
                      {quizQuestions.length - Object.keys(answers).length} remaining)
                    </motion.p>
                  )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    <SiteFooter />
    </div>
  )
}
