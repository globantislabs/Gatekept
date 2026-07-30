import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// ─── File limits ─────────────────────────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac']

// POST /api/upload — Upload a file (image, video, or audio)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image' // 'image', 'video', or 'audio'

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type and size
    if (type === 'image') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return errorResponse(`Invalid image type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`, 400)
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return errorResponse(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`, 400)
      }
    } else if (type === 'video') {
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return errorResponse(`Invalid video type: ${file.type}. Allowed: MP4, WebM, OGG`, 400)
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return errorResponse(`Video too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 50MB`, 400)
      }
    } else if (type === 'audio') {
      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
        return errorResponse(`Invalid audio type: ${file.type}. Allowed: MP3, WAV, OGG, WebM, AAC`, 400)
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return errorResponse(`Audio too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 20MB`, 400)
      }
    } else {
      return errorResponse('Invalid type. Use "image", "video", or "audio"', 400)
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg')
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const subDir = type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'products'
    const relativePath = `/uploads/${subDir}/${uniqueName}`

    // In standalone mode, process.cwd() points to .next/standalone/
    // We need to write to the public directory which is at process.cwd()/public
    const publicDir = path.join(process.cwd(), 'public', 'uploads', subDir)
    const absolutePath = path.join(publicDir, uniqueName)

    // Ensure directory exists
    await mkdir(publicDir, { recursive: true })

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(absolutePath, buffer)

    return jsonResponse({
      success: true,
      url: relativePath,
      fileName: uniqueName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Upload failed', 500)
  }
}
