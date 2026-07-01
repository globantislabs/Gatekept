'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, CheckCircle, Lock, ArrowRight, ArrowLeft, RefreshCw,
  AlertCircle, ChevronRight, Trophy, Video, FileQuestion, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { productVideoService, productQuizService, productLearningService, productService } from '@/lib/data-service'
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

const PASS_THRESHOLD = 4 // need 4 out of 5 correct (80%)

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
  const { selectedProductId, user, navigateTo } = useAppStore()

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
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Quiz state ───────────────────────────────────────
  const [quizQuestions, setQuizQuestions] = useState<ProductQuiz[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ─── Derived ──────────────────────────────────────────
  const currentVideo = currentStep.type === 'video' || currentStep.type === 'quiz'
    ? videos[currentStep.videoIndex] || null
    : null

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
      try {
        const [prodRes, vidRes, progRes] = await Promise.all([
          productService.getById(selectedProductId),
          productVideoService.getByProduct(selectedProductId),
          user
            ? productLearningService.getProgress(user.user_id, selectedProductId)
            : Promise.resolve({ data: null, error: null }),
        ])
        if (cancelled) return
        setProduct(prodRes.data || null)
        const loadedVideos = vidRes.data || []
        setVideos(loadedVideos)
        setProgress(progRes.data || null)

        // Determine which step to start on based on saved progress
        if (progRes.data && loadedVideos.length > 0) {
          const savedProgress = progRes.data as ProductLearningProgress
          // Check quiz_answers to see which quizzes were already passed
          // We'll reconstruct the step from the progress
          const vp = savedProgress.video_progress || {}
          const qa = savedProgress.quiz_answers || {}

          // Find the first video that is not 100% complete
          let startVideoIdx = 0
          for (let i = 0; i < loadedVideos.length; i++) {
            const vidProg = vp[loadedVideos[i].id] ?? 0
            if (vidProg < 100) {
              startVideoIdx = i
              break
            }
            if (i === loadedVideos.length - 1) {
              startVideoIdx = loadedVideos.length - 1
            }
          }

          // If the status is already UNLOCKED or COMPLETED, go to completed
          if (savedProgress.status === 'UNLOCKED' || savedProgress.status === 'COMPLETED') {
            const allPassed: Record<number, boolean> = {}
            for (let i = 0; i < loadedVideos.length; i++) {
              allPassed[i] = true
            }
            setPassedQuizzes(allPassed)
            setCurrentStep({ type: 'completed' })
          } else {
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
    setQuizResult(null)
    setAnswers({})
    setCurrentQuestionIdx(0)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // Set video progress from saved data
    if (currentStep.type === 'video' && currentVideo) {
      const savedProg = progress?.video_progress?.[currentVideo.id] ?? 0
      setVideoProgress(savedProg)
    } else {
      setVideoProgress(0)
    }
  }, [currentStep.type, currentStep.type === 'video' || currentStep.type === 'quiz' ? currentStep.videoIndex : null, currentVideo?.id])

  // ─── Fetch quiz questions when entering a quiz step ───
  useEffect(() => {
    if (currentStep.type !== 'quiz') return
    const video = videos[currentStep.videoIndex]
    if (!video) return

    let cancelled = false
    async function loadQuiz() {
      setQuizLoading(true)
      try {
        const res = await productQuizService.getByVideo(video.id)
        if (!cancelled) {
          setQuizQuestions(res.data || [])
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

  // ─── Simulated video playback ─────────────────────────
  useEffect(() => {
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
  }, [playing])

  // ─── Save video progress to backend ───────────────────
  const saveVideoProgress = useCallback(async (pct: number) => {
    if (!user || !selectedProductId || !currentVideo) return
    const updatedVP = { ...(progress?.video_progress || {}), [currentVideo.id]: pct }
    const res = await productLearningService.updateVideoProgress(user.user_id, selectedProductId, updatedVP)
    if (res.data) setProgress(res.data)
  }, [user, selectedProductId, currentVideo, progress?.video_progress])

  // ─── Auto-save when video completes ───────────────────
  useEffect(() => {
    if (videoProgress >= 100 && currentStep.type === 'video' && currentVideo) {
      saveVideoProgress(100)
    }
  }, [videoProgress, currentStep.type, currentVideo?.id, saveVideoProgress])

  // ─── Video player handlers ────────────────────────────
  const handlePlayPause = () => {
    if (videoProgress >= 100) return
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
    if (!user || !selectedProductId) return
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
      const passed = correctCount >= PASS_THRESHOLD

      const result: QuizResult = {
        correct: correctCount,
        total: totalQuestions,
        passed,
        answers: { ...answers },
      }
      setQuizResult(result)

      // Submit via service
      const overallScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
      const res = await productLearningService.submitQuiz(
        user.user_id,
        selectedProductId,
        quizAnswersMap,
        overallScore,
        passed
      )

      if (res.data) {
        setProgress(res.data)
      }

      if (passed) {
        // Mark this quiz as passed
        setPassedQuizzes((prev) => ({
          ...prev,
          [currentStep.type === 'quiz' ? currentStep.videoIndex : -1]: true,
        }))
        toast.success('Quiz passed! Moving to the next lesson.')
      } else {
        toast.error(`You got ${correctCount}/${totalQuestions} correct. You need ${PASS_THRESHOLD} to pass. Please re-watch the video and try again.`)
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
      // All quizzes passed — unlock the product
      setCurrentStep({ type: 'completed' })
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
              onClick={() => navigateTo('products')}
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
  return (
    <motion.div {...fadeInUp} transition={{ duration: 0.4 }} className="max-w-4xl mx-auto px-4 py-6">
      {/* ─── Header ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateTo('products')}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: BRAND.dark }} />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-xl sm:text-2xl font-bold" style={{ color: BRAND.dark }}>
            Learn: {product.name}
          </h1>
          <p className="text-sm" style={{ color: BRAND.muted }}>
            Complete each video and quiz to unlock this product
          </p>
        </div>
        <Badge
          style={{
            backgroundColor: currentStep.type === 'completed' ? BRAND.lime : BRAND.surface,
            color: currentStep.type === 'completed' ? BRAND.dark : BRAND.muted,
          }}
          className="text-xs font-medium"
        >
          {currentStep.type === 'completed' ? 'Unlocked' : `${overallPct}% Progress`}
        </Badge>
      </div>

      {/* ─── Step Progress Indicator ───────────────────── */}
      <Card className="mb-6" style={{ borderColor: BRAND.surface }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
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
                  <div className="flex flex-col items-center gap-1 min-w-[48px]">
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
              {/* Simulated video area */}
              <div
                className="relative aspect-video bg-gray-900 flex items-center justify-center cursor-pointer"
                onClick={handlePlayPause}
              >
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div
                      className="text-9xl font-heading font-bold select-none"
                      style={{ color: BRAND.lime }}
                    >
                      {product.name.charAt(0)}
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

              {/* Progress bar (seek bar) */}
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

              {/* Video title & controls */}
              <CardContent className="p-4">
                <h3 className="font-heading text-lg font-semibold" style={{ color: BRAND.dark }}>
                  {currentVideo?.title || 'Video'}
                </h3>
                <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                  {currentVideo?.description || ''}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: BRAND.green }}>
                      {videoProgress}%
                    </span>
                    <span className="text-sm" style={{ color: BRAND.muted }}>
                      watched
                    </span>
                  </div>

                  {videoProgress >= 100 && (
                    <Button
                      size="sm"
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
                    You need {PASS_THRESHOLD} out of 5 correct answers (80%) to pass.
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
                      : `You got ${quizResult.correct}/${quizResult.total} correct — you need ${PASS_THRESHOLD} to pass`}
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
                        : `${PASS_THRESHOLD - quizResult.correct} more correct answer${PASS_THRESHOLD - quizResult.correct !== 1 ? 's' : ''} needed`}
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
                          Unlock Product <Trophy className="h-4 w-4 ml-1" />
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
                      Answer all {quizQuestions.length} questions — need {PASS_THRESHOLD}/{quizQuestions.length} correct to pass
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
                            {quizQuestions[currentQuestionIdx].difficulty && (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: BRAND.surface, color: BRAND.muted }}
                              >
                                {quizQuestions[currentQuestionIdx].difficulty}
                              </Badge>
                            )}
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

                        <CardFooter className="flex justify-between p-6 pt-2">
                          <Button
                            variant="outline"
                            disabled={currentQuestionIdx === 0}
                            onClick={() =>
                              setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))
                            }
                            style={{ borderColor: BRAND.surface, color: BRAND.dark }}
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>

                          {currentQuestionIdx < quizQuestions.length - 1 ? (
                            <Button
                              onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                              style={{ backgroundColor: BRAND.green, color: '#fff' }}
                            >
                              Next <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          ) : (
                            <Button
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

        {/* ═══ COMPLETED STEP ═══ */}
        {currentStep.type === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              className="border-2 text-center"
              style={{ borderColor: BRAND.lime, backgroundColor: `${BRAND.lime}08` }}
            >
              <CardHeader className="pb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                  <Trophy className="h-20 w-20 mx-auto" style={{ color: BRAND.lime }} />
                </motion.div>
                <CardTitle className="font-heading text-3xl mt-4" style={{ color: BRAND.dark }}>
                  Product Unlocked!
                </CardTitle>
                <CardDescription className="text-base mt-2" style={{ color: BRAND.muted }}>
                  Congratulations! You have completed all learning modules and quizzes for{' '}
                  <span className="font-semibold" style={{ color: BRAND.dark }}>
                    {product.name}
                  </span>
                  .
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Completed steps summary */}
                <div
                  className="rounded-lg p-4 mx-auto max-w-sm"
                  style={{ backgroundColor: `${BRAND.lime}15` }}
                >
                  <h4 className="font-heading text-sm font-semibold mb-3" style={{ color: BRAND.dark }}>
                    Learning Journey Complete
                  </h4>
                  <div className="space-y-2">
                    {videos.map((video, idx) => (
                      <div key={video.id} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" style={{ color: BRAND.lime }} />
                        <span className="text-sm" style={{ color: BRAND.dark }}>
                          Video {idx + 1} & Quiz {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-2 justify-center">
                <Button
                  size="lg"
                  className="font-heading font-semibold"
                  style={{ backgroundColor: BRAND.lime, color: BRAND.dark }}
                  onClick={() => navigateTo('products')}
                >
                  Browse Products <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
