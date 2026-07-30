import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// ─── File limits ─────────────────────────────────────────────
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

// POST /api/upload — Upload a file (image or video)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'image' // 'image' or 'video'

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type
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
    } else {
      return errorResponse('Invalid type. Use "image" or "video"', 400)
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg')
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const subDir = type === 'video' ? 'videos' : 'products'
    const relativePath = `/uploads/${subDir}/${uniqueName}`
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', subDir, uniqueName)

    // Ensure directory exists
    await mkdir(path.join(process.cwd(), 'public', 'uploads', subDir), { recursive: true })

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
