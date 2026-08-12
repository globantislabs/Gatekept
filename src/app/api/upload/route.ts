// POST /api/upload — Upload files (images & videos) to public/uploads/
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
}

// Max file sizes (in bytes)
const MAX_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024,   // 5MB
  video: 50 * 1024 * 1024,  // 50MB
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image' // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedMimes = ALLOWED_TYPES[type] || ALLOWED_TYPES.image
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type: ${file.type}. Allowed: ${allowedMimes.join(', ')}` 
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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Return the URL path (relative to public, prefixed with /uploads/)
    const url = `/uploads/${subdir}/${filename}`

    console.log(`[Upload] Saved ${type}: ${url} (${(file.size / 1024).toFixed(1)}KB)`)

    return NextResponse.json({ 
      url,
      size: file.size,
      type: file.type,
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
  }
  return map[mime] || '.bin'
}
