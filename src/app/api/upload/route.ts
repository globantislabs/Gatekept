// POST /api/upload — Upload files (images & videos)
// Files are saved to BOTH data/uploads/ (persistent) AND public/uploads/ (static serving)
// This ensures videos work in dev (API route) AND production (static files + API route)
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, stat, unlink } from 'fs/promises'
import path from 'path'

// Primary: persistent upload directory (outside public/)
const DATA_UPLOAD_ROOT = path.join(process.cwd(), 'data', 'uploads')
// Secondary: public directory for static serving (works with Next.js build output)
const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
}

// Max file sizes (in bytes)
const MAX_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024,   // 5MB
  video: 100 * 1024 * 1024, // 100MB
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image' // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type - be lenient with MIME detection
    const allowedMimes = ALLOWED_TYPES[type] || ALLOWED_TYPES.image
    const isAllowedMime = allowedMimes.includes(file.type)
    const isAllowedExt = type === 'video'
      ? /\.(mp4|webm|mov|avi)$/i.test(file.name)
      : /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)

    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type || 'unknown'}. Allowed: ${allowedMimes.join(', ')}`
      }, { status: 400 })
    }

    // Validate file size
    const maxSize = MAX_SIZES[type] || MAX_SIZES.image
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxSize / 1024 / 1024}MB`
      }, { status: 400 })
    }

    // Generate unique filename
    const ext = path.extname(file.name).toLowerCase() || getExtFromMime(file.type)
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomStr}${ext}`

    // Determine subdirectory
    const subdir = type === 'video' ? 'videos' : 'products'

    // Read file data
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate: ensure we actually got data
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty (0 bytes)' }, { status: 400 })
    }
    if (buffer.length < 100 && type === 'video') {
      return NextResponse.json({ error: 'Video file too small — likely corrupt or empty upload' }, { status: 400 })
    }

    // Ensure directories exist
    const dataDir = path.join(DATA_UPLOAD_ROOT, subdir)
    const publicDir = path.join(PUBLIC_UPLOAD_ROOT, subdir)
    await mkdir(dataDir, { recursive: true })
    await mkdir(publicDir, { recursive: true })

    // Write to BOTH data/ (persistent across builds) and public/ (static serving in production)
    const dataFilePath = path.join(dataDir, filename)
    const publicFilePath = path.join(publicDir, filename)

    await writeFile(dataFilePath, buffer)
    try { await writeFile(publicFilePath, buffer) } catch (e) { console.warn('[Upload] Could not write to public/, non-fatal:', e) }

    // Verify the file was written correctly
    try {
      const writtenStat = await stat(dataFilePath)
      if (writtenStat.size !== buffer.length) {
        console.error(`[Upload] File size mismatch! Expected ${buffer.length}, got ${writtenStat.size}`)
        await unlink(dataFilePath).catch(() => {})
        try { await unlink(publicFilePath).catch(() => {}) } catch {}
        return NextResponse.json({ error: 'File write verification failed' }, { status: 500 })
      }
    } catch (verifyErr) {
      console.error('[Upload] File verification error:', verifyErr)
      return NextResponse.json({ error: 'File write verification failed' }, { status: 500 })
    }

    // Return the URL path — served via /api/uploads/[...path] or /uploads/ directly
    const url = `/uploads/${subdir}/${filename}`

    console.log(`[Upload] Saved ${type}: ${url} (${(buffer.length / 1024).toFixed(1)}KB) → data/ + public/`)

    return NextResponse.json({
      url,
      size: buffer.length,
      type: file.type || 'video/mp4',
      filename,
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// Helper: get extension from MIME type
function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
  }
  return map[mime] || '.bin'
}
