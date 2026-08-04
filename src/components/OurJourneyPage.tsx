'use client'

import React, { useRef } from 'react'

import { motion, useInView } from 'framer-motion'
import {
  ArrowLeft, Leaf, Heart, Zap, FlaskConical, Users, Globe,
  Microscope, ShieldCheck, TrendingUp, ChevronRight,
  Sparkles, Beaker, Target, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import SiteFooter from '@/components/SiteFooter'
import { useAppStore } from '@/store/app-store'

// ============================================================
// BRAND CONSTANTS
// ============================================================
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
  blue: '#2e91b2',
}

// ============================================================
// ANIMATION VARIANTS
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const timelineDot = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, type: 'spring', stiffness: 200 } },
}

const glowPulse = {
  animate: {
    boxShadow: [
      `0 0 20px ${BRAND.green}40`,
      `0 0 40px ${BRAND.green}60`,
      `0 0 20px ${BRAND.green}40`,
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ============================================================
// FLOATING PARTICLES COMPONENT
// ============================================================
function FloatingParticles() {
  // Deterministic particle data to avoid hydration mismatch
  const particles = [
    { w:3, h:3, l:12, t:8,  op:0.2, yEnd:-80,  xEnd:15,  opMid:0.35, dur:10, del:0.5 },
    { w:4, h:4, l:45, t:22, op:0.15, yEnd:-100, xEnd:-10, opMid:0.3,  dur:8,  del:1.2 },
    { w:2, h:2, l:78, t:55, op:0.25, yEnd:-60,  xEnd:20,  opMid:0.4,  dur:12, del:2.0 },
    { w:5, h:5, l:33, t:70, op:0.1,  yEnd:-120, xEnd:-25, opMid:0.25, dur:14, del:0.8 },
    { w:3, h:3, l:90, t:35, op:0.2,  yEnd:-90,  xEnd:10,  opMid:0.35, dur:9,  del:3.0 },
    { w:4, h:4, l:5,  t:85, op:0.15, yEnd:-140, xEnd:30,  opMid:0.3,  dur:11, del:1.5 },
    { w:2, h:2, l:60, t:15, op:0.25, yEnd:-50,  xEnd:-15, opMid:0.4,  dur:7,  del:0.3 },
    { w:3, h:3, l:22, t:42, op:0.2,  yEnd:-110, xEnd:5,   opMid:0.35, dur:13, del:2.5 },
    { w:5, h:5, l:72, t:78, op:0.1,  yEnd:-70,  xEnd:-20, opMid:0.25, dur:10, del:1.0 },
    { w:4, h:4, l:15, t:60, op:0.15, yEnd:-130, xEnd:25,  opMid:0.3,  dur:8,  del:0.7 },
    { w:2, h:2, l:55, t:90, op:0.25, yEnd:-80,  xEnd:-5,  opMid:0.4,  dur:12, del:2.2 },
    { w:3, h:3, l:85, t:5,  op:0.2,  yEnd:-100, xEnd:15,  opMid:0.35, dur:9,  del:1.8 },
    { w:4, h:4, l:40, t:32, op:0.15, yEnd:-60,  xEnd:-10, opMid:0.3,  dur:11, del:3.5 },
    { w:5, h:5, l:68, t:48, op:0.1,  yEnd:-120, xEnd:30,  opMid:0.25, dur:14, del:0.2 },
    { w:2, h:2, l:28, t:75, op:0.25, yEnd:-90,  xEnd:-25, opMid:0.4,  dur:7,  del:1.3 },
    { w:3, h:3, l:95, t:62, op:0.2,  yEnd:-140, xEnd:10,  opMid:0.35, dur:10, del:2.8 },
    { w:4, h:4, l:8,  t:18, op:0.15, yEnd:-50,  xEnd:20,  opMid:0.3,  dur:13, del:0.6 },
    { w:2, h:2, l:50, t:95, op:0.25, yEnd:-110, xEnd:-15, opMid:0.4,  dur:8,  del:1.0 },
    { w:3, h:3, l:38, t:50, op:0.2,  yEnd:-70,  xEnd:5,   opMid:0.35, dur:12, del:3.2 },
    { w:5, h:5, l:82, t:28, op:0.1,  yEnd:-130, xEnd:-30, opMid:0.25, dur:9,  del:0.9 },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.w,
            height: p.h,
            background: i % 3 === 0 ? BRAND.green : i % 3 === 1 ? BRAND.lime : BRAND.muted,
            opacity: p.op,
            left: `${p.l}%`,
            top: `${p.t}%`,
          }}
          animate={{
            y: [0, p.yEnd, 0],
            x: [0, p.xEnd, 0],
            opacity: [0.1, p.opMid, 0.1],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.del,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================
// GRADIENT BLOBS
// ============================================================
function GradientBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: `${BRAND.green}15`, top: '-10%', right: '-10%' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: `${BRAND.lime}10`, bottom: '-5%', left: '-5%' }}
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full blur-[80px]"
        style={{ background: `${BRAND.blue}08`, top: '40%', left: '30%' }}
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

// ============================================================
// SECTION WRAPPER
// ============================================================
function SectionWrapper({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={`relative py-16 md:py-24 ${className}`}
      style={{ backgroundColor: BRAND.dark }}
    >
      {children}
    </motion.section>
  )
}

// ============================================================
// TIMELINE DATA
// ============================================================
const TIMELINE_EVENTS = [
  {
    year: '2024',
    title: 'Research Begins at IIT Mumbai',
    description: 'A team of biochemists and nutritionists at IIT Mumbai begin studying the effects of apple cider vinegar on glycemic response in Indian diets.',
    icon: Microscope,
  },
  {
    year: '2025',
    title: 'First Prototype Developed',
    description: 'After 18 months of formulation trials, the first functional wellness shot prototype is created — blending ACV with turmeric, ginger, and cinnamon extracts.',
    icon: Beaker,
  },
  {
    year: '2025',
    title: 'Clinical Trials with Apollo Hospitals',
    description: 'Partnership with Apollo Hospitals validates the product\'s efficacy. Phase-1 trials show a 27% reduction in post-meal glucose spikes across 200 participants.',
    icon: ShieldCheck,
  },
  {
    year: '2026',
    title: 'NOTJUST Watr Fizz Launched',
    description: 'The sparkling variant hits the market — a refreshing, effervescent wellness shot that makes glycemic control enjoyable and social.',
    icon: Sparkles,
  },
  {
    year: '2026',
    title: 'NOTJUST Watr Still Launched',
    description: 'The calm, concentrated still variant is released for daily routine use — perfect for morning shots and pre-meal consumption.',
    icon: Target,
  },
  {
    year: 'Future',
    title: 'Pan-India Distribution',
    description: 'Expanding to 50+ cities, launching subscription packs, and partnering with retail chains to make NOTJUST Watr accessible to every Indian household.',
    icon: Globe,
  },
]

// ============================================================
// VALUES DATA
// ============================================================
const VALUES = [
  {
    title: 'Science First',
    description: 'Every claim is backed by peer-reviewed research and clinical trials. We don\'t guess — we test, measure, and publish.',
    icon: FlaskConical,
  },
  {
    title: 'Natural Ingredients',
    description: 'No artificial sweeteners, preservatives, or colourants. Just pure, potent botanicals — apple cider vinegar, turmeric, ginger, cinnamon.',
    icon: Leaf,
  },
  {
    title: 'Accessible Wellness',
    description: 'Health shouldn\'t be a luxury. At ₹15 per shot, NOTJUST Watr makes glycemic control affordable for every Indian.',
    icon: Heart,
  },
]

// ============================================================
// TEAM DATA
// ============================================================
const TEAM_MEMBERS = [
  {
    name: 'Dr. Anil Mehta',
    role: 'Chief Medical Officer',
    bio: 'Former endocrinologist at Apollo Hospitals with 20+ years in metabolic health research. Led our clinical trials and ensures every product meets medical-grade standards.',
    initials: 'AM',
  },
  {
    name: 'Priya Sharma',
    role: 'Product Development Lead',
    bio: 'IIT Mumbai biochemist who turned research into reality. Priya spent 18 months perfecting the formulation — balancing potency with palatability.',
    initials: 'PS',
  },
  {
    name: 'Vikram Patel',
    role: 'Distribution & Partnerships',
    bio: 'Former FMCG executive with deep retail network across India. Vikram is building the distribution backbone that will carry NOTJUST Watr to every corner of the country.',
    initials: 'VP',
  },
]

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection() {
  const { navigateTo } = useAppStore()

  return (
    <section
      className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: BRAND.dark }}
    >
      <GradientBlobs />
      <FloatingParticles />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Back Button */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Button
            onClick={() => navigateTo('landing')}
            variant="ghost"
            className="text-[#f4f3f0]/70 hover:text-[#f4f3f0] hover:bg-white/10 gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeInUp}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          style={{ color: '#f4f3f0' }}
        >
          Our{' '}
          <span
            className="relative inline-block"
            style={{ color: BRAND.lime }}
          >
            Journey
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
              style={{ background: BRAND.lime }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeInUp}
          className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto"
          style={{ color: BRAND.muted }}
        >
          From ancient wisdom to modern wellness — the story of how science, nature, and purpose came together.
        </motion.p>

        {/* Decorative line */}
        <motion.div
          variants={fadeInUp}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <div className="w-12 h-[1px]" style={{ background: BRAND.muted }} />
          <Leaf className="w-5 h-5" style={{ color: BRAND.green }} />
          <div className="w-12 h-[1px]" style={{ background: BRAND.muted }} />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{ background: `linear-gradient(to top, ${BRAND.dark}, transparent)` }}
      />
    </section>
  )
}

// ============================================================
// ORIGIN STORY SECTION
// ============================================================
function OriginStorySection() {
  const stories = [
    {
      title: 'The Problem We Saw',
      subtitle: 'India\'s Silent Epidemic',
      description:
        'India has over 100 million diabetics — the highest in the world. But the problem is bigger than diabetes. Every Indian meal — rice, roti, dal — causes post-meal glucose spikes that silently damage blood vessels, accelerate aging, and drain energy. Even "healthy" people are affected. The science is clear: controlling these spikes is the single most impactful thing you can do for long-term health.',
      accent: BRAND.green,
      icon: TrendingUp,
    },
    {
      title: 'The Science Behind It',
      subtitle: 'Ancient Wisdom, Proven by Research',
      description:
        'Apple cider vinegar has been used for millennia in Ayurveda. Modern science now confirms: acetic acid in ACV slows gastric emptying and improves insulin sensitivity, reducing post-meal glucose spikes by up to 30%. We combined this with turmeric (anti-inflammatory), ginger (digestive aid), and cinnamon (insulin sensitizer) — creating a synergistic blend that amplifies each ingredient\'s effect.',
      accent: BRAND.lime,
      icon: FlaskConical,
    },
    {
      title: 'Our Mission',
      subtitle: 'Accessible. Affordable. Enjoyable.',
      description:
        'Glycemic control shouldn\'t cost ₹500 a day or require a doctor\'s prescription. Our mission is to make it as simple as drinking a shot — something you enjoy, something you afford, something that works. NOTJUST Watr is priced at ₹15 per shot. No compromise on quality. No compromise on taste. No compromise on science.',
      accent: BRAND.green,
      icon: Target,
    },
  ]

  return (
    <SectionWrapper id="origin-story">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            style={{ color: '#f4f3f0' }}
          >
            Why We Exist
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: BRAND.muted }}>
            The problem, the science, and the mission that drives everything we do.
          </p>
        </motion.div>

        {/* Story Cards */}
        <div className="space-y-8 md:space-y-12">
          {stories.map((story, idx) => (
            <motion.div
              key={story.title}
              variants={fadeInUp}
              className="relative rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#2a2a28',
                borderLeft: `3px solid ${story.accent}`,
              }}
            >
              {/* Card glow */}
              <div
                className="absolute top-0 left-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none"
                style={{ background: `${story.accent}15` }}
              />

              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0"
                    style={{ backgroundColor: `${story.accent}20` }}
                  >
                    <story.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: story.accent }} />
                  </div>
                  <div>
                    <h3
                      className="text-xl sm:text-2xl font-bold mb-1"
                      style={{ color: '#f4f3f0' }}
                    >
                      {story.title}
                    </h3>
                    <span
                      className="text-sm font-medium tracking-wide uppercase"
                      style={{ color: story.accent }}
                    >
                      {story.subtitle}
                    </span>
                  </div>
                </div>
                <p
                  className="text-base sm:text-lg leading-relaxed"
                  style={{ color: BRAND.muted }}
                >
                  {story.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// TIMELINE SECTION
// ============================================================
function TimelineSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <SectionWrapper id="timeline" className="overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            style={{ color: '#f4f3f0' }}
          >
            The Road So Far
          </h2>
          <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: BRAND.muted }}>
            Key milestones in our journey from research to reality.
          </p>
        </motion.div>

        {/* Timeline */}
        <div ref={ref} className="relative">
          {/* Central line */}
          <motion.div
            className="absolute left-4 sm:left-6 md:left-8 top-0 bottom-0 w-[2px]"
            style={{ background: `linear-gradient(to bottom, ${BRAND.green}, ${BRAND.lime}, ${BRAND.muted}40)` }}
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Events */}
          <div className="space-y-10 md:space-y-12">
            {TIMELINE_EVENTS.map((event, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeInUp}
                className="relative pl-12 sm:pl-16 md:pl-20"
              >
                {/* Dot on timeline */}
                <motion.div
                  variants={timelineDot}
                  className="absolute left-[6px] sm:left-[10px] md:left-[14px] top-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: idx <= 3 ? BRAND.green : idx <= 4 ? BRAND.lime : '#2a2a28',
                    border: `2px solid ${idx <= 3 ? BRAND.green : BRAND.lime}`,
                    boxShadow: `0 0 12px ${idx <= 3 ? `${BRAND.green}40` : `${BRAND.lime}40`}`,
                  }}
                >
                  <event.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#f4f3f0' }} />
                </motion.div>

                {/* Year badge */}
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wider mb-2"
                  style={{
                    color: idx <= 3 ? BRAND.green : BRAND.lime,
                    backgroundColor: `${idx <= 3 ? BRAND.green : BRAND.lime}15`,
                    border: `1px solid ${idx <= 3 ? BRAND.green : BRAND.lime}30`,
                  }}
                >
                  {event.year}
                </div>

                {/* Content */}
                <h3
                  className="text-lg sm:text-xl md:text-2xl font-bold mb-2"
                  style={{ color: '#f4f3f0' }}
                >
                  {event.title}
                </h3>
                <p
                  className="text-sm sm:text-base leading-relaxed max-w-xl"
                  style={{ color: BRAND.muted }}
                >
                  {event.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// VALUES SECTION
// ============================================================
function ValuesSection() {
  return (
    <SectionWrapper id="values">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            style={{ color: '#f4f3f0' }}
          >
            What We Stand For
          </h2>
          <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: BRAND.muted }}>
            Three principles that guide every decision we make.
          </p>
        </motion.div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {VALUES.map((value, idx) => (
            <motion.div
              key={value.title}
              variants={fadeInScale}
              className="relative rounded-2xl overflow-hidden group"
              style={{
                backgroundColor: '#2a2a28',
                border: `1px solid ${BRAND.green}25`,
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${BRAND.green}08, transparent 70%)`,
                }}
              />
              {/* Border glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 30px ${BRAND.green}15, 0 0 20px ${BRAND.green}10`,
                }}
              />

              <div className="relative z-10 p-6 sm:p-8 text-center">
                {/* Icon */}
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${BRAND.green}20` }}
                >
                  <value.icon className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: BRAND.green }} />
                </div>

                {/* Title */}
                <h3
                  className="text-xl sm:text-2xl font-bold mb-3"
                  style={{ color: '#f4f3f0' }}
                >
                  {value.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: BRAND.muted }}
                >
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// TEAM SECTION
// ============================================================
function TeamSection() {
  return (
    <SectionWrapper id="team">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
            style={{ color: '#f4f3f0' }}
          >
            The People Behind It
          </h2>
          <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: BRAND.muted }}>
            A team united by purpose — making wellness accessible for every Indian.
          </p>
        </motion.div>

        {/* Team Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {TEAM_MEMBERS.map((member, idx) => (
            <motion.div
              key={member.name}
              variants={fadeInScale}
              className="relative rounded-2xl overflow-hidden group"
              style={{ backgroundColor: '#2a2a28' }}
            >
              {/* Hover subtle glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${BRAND.lime}08, transparent 70%)`,
                }}
              />

              <div className="relative z-10 p-6 sm:p-8 text-center">
                {/* Avatar */}
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-5 ring-2 transition-all duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${BRAND.green}20`,
                    ringColor: BRAND.green,
                    borderColor: BRAND.green,
                    boxShadow: `0 0 0 2px ${BRAND.green}40`,
                  }}
                >
                  <span
                    className="text-xl sm:text-2xl font-bold"
                    style={{ color: BRAND.green }}
                  >
                    {member.initials}
                  </span>
                </div>

                {/* Name */}
                <h3
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={{ color: '#f4f3f0' }}
                >
                  {member.name}
                </h3>

                {/* Role */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-4"
                  style={{
                    color: BRAND.lime,
                    backgroundColor: `${BRAND.lime}15`,
                    border: `1px solid ${BRAND.lime}25`,
                  }}
                >
                  {member.role}
                </span>

                {/* Bio */}
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: BRAND.muted }}
                >
                  {member.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// CALL TO ACTION SECTION
// ============================================================
function CTASection() {
  const { navigateTo } = useAppStore()

  return (
    <SectionWrapper id="cta">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div variants={fadeInUp} className="mb-8">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-4" style={{ color: BRAND.lime }} />
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
          style={{ color: '#f4f3f0' }}
        >
          Ready to experience{' '}
          <span style={{ color: BRAND.lime }}>NOTJUST Watr</span>?
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg mb-8 max-w-xl mx-auto"
          style={{ color: BRAND.muted }}
        >
          One shot. Better glucose control. No compromise.
        </motion.p>

        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary CTA */}
          <motion.div {...glowPulse}>
            <Button
              onClick={() => navigateTo('products')}
              className="min-h-[44px] px-8 py-3 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: BRAND.green,
                color: '#f4f3f0',
                borderColor: BRAND.green,
              }}
            >
              <ChevronRight className="w-5 h-5 mr-1" />
              Explore Products
            </Button>
          </motion.div>

          {/* Secondary CTA */}
          <Button
            onClick={() => navigateTo('landing')}
            variant="outline"
            className="min-h-[44px] px-8 py-3 text-base font-semibold rounded-xl"
            style={{
              borderColor: `${BRAND.muted}40`,
              color: '#f4f3f0',
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}

// MAIN COMPONENT
// ============================================================
export function OurJourneyPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BRAND.dark }}
    >
      <HeroSection />
      <OriginStorySection />
      <TimelineSection />
      <ValuesSection />
      <TeamSection />
      <CTASection />
      <SiteFooter />
    </div>
  )
}
