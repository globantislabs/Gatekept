'use client'

import React, { useState } from 'react'
import Image from 'next/image'

// ─── Brand Constants ────────────────────────────────────────
const BRAND = {
  green: '#48805b',
  lime: '#afb75d',
  dark: '#1f1e1c',
  muted: '#88837b',
  surface: '#e3dfd8',
  bg: '#f4f3f0',
}

interface ProductImageProps {
  src: string | null | undefined
  alt: string
  productType?: string | null
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
}

/**
 * ProductImage — Handles product image display with graceful fallback.
 *
 * When the uploaded image (e.g. /uploads/products/xxx.jpeg) fails to load
 * (404 on production after redeploy, missing file, etc.), it automatically
 * falls back to the default product image based on product type.
 */
export default function ProductImage({
  src,
  alt,
  productType,
  fill = false,
  width,
  height,
  className = '',
  sizes,
  priority = false,
}: ProductImageProps) {
  const [imgError, setImgError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // Reset error state when src changes (e.g., navigating to a different product)
  if (src !== currentSrc) {
    setCurrentSrc(src)
    setImgError(false)
  }

  // Determine the fallback image based on product type
  const fallbackSrc = productType === 'STILL'
    ? '/images/product-still.webp'
    : '/images/product-fizz.webp'

  // Use the original source if it exists and no error, otherwise use fallback
  const imageSrc = src && !imgError ? src : fallbackSrc

  // Check if the source is an uploaded file (starts with /uploads/ or /api/uploads/)
  const isUploadedFile = src?.startsWith('/uploads/') || src?.startsWith('/api/uploads/')

  // For uploaded files, use a regular img tag to avoid Next.js Image optimization issues
  // (standalone deployments may not have the file at build time)
  if (isUploadedFile && !imgError) {
    // Convert /uploads/ paths to /api/uploads/ for production compatibility
    const serveSrc = src!.startsWith('/uploads/') ? `/api${src!}` : src!
    return (
      <img
        src={serveSrc}
        alt={alt}
        className={className}
        onError={() => setImgError(true)}
        loading={priority ? 'eager' : 'lazy'}
        style={fill ? { width: '100%', height: '100%' } : undefined}
      />
    )
  }

  // For fallback images or non-uploaded sources, use Next.js Image
  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={() => {
          if (!imgError) setImgError(true)
        }}
      />
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => {
        if (!imgError) setImgError(true)
      }}
    />
  )
}
