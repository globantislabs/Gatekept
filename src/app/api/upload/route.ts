import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
}

// Map upload type → directory name
// 'image' → 'products', 'video' → 'videos', 'audio' → 'audio'
const TYPE_TO_DIR: Record<string, string> = {
  image: 'products',
  video: 'videos',
  audio: 'audio',
}

// Max file sizes (in bytes)
const MAX_SIZE: Record<string, number> = {
  image: 5 * 1024 * 1024,   // 5 MB
  video: 50 * 1024 * 1024,  // 50 MB
  audio: 10 * 1024 * 1024,  // 10 MB
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate type
    const normalizedType = type.endsWith('s') ? type.slice(0, -1) : type // 'images' -> 'image'
    if (!ALLOWED_TYPES[normalizedType]) {
      return NextResponse.json({ error: `Invalid type: ${type}. Must be one of: image, video, audio` }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_TYPES[normalizedType].includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES[normalizedType].join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = MAX_SIZE[normalizedType] || MAX_SIZE.image
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${(maxSize / 1024 / 1024).toFixed(0)}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || mimeToExt(file.type)
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`

    // Map type to directory name (image → products, video → videos, etc.)
    const dirName = TYPE_TO_DIR[normalizedType] || `${normalizedType}s`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', dirName)
    await mkdir(uploadDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadDir, uniqueId)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Return the public URL path
    const url = `/uploads/${dirName}/${uniqueId}`

    return NextResponse.json({ url, size: file.size, type: file.type })
  } catch (error) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Helper: convert MIME type to file extension
function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/ogg': '.ogg',
    'audio/wav': '.wav',
    'audio/webm': '.webm',
  }
  return map[mime] || '.bin'
}
