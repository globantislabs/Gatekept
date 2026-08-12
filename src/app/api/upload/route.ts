// POST /api/upload — Upload files (images & videos) to data/uploads/
// Files are stored OUTSIDE public/ so they survive code deploys/restarts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Persistent upload directory (outside public/)
const UPLOAD_ROOT = path.join(process.cwd(), 'data', 'uploads')

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

    // Ensure directory exists
    const uploadDir = path.join(UPLOAD_ROOT, subdir)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Return the URL path — served via /api/uploads/[...path]
    const url = `/uploads/${subdir}/${filename}`

    console.log(`[Upload] Saved ${type}: ${url} (${(file.size / 1024).toFixed(1)}KB)`)

    return NextResponse.json({
      url,
      size: file.size,
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
