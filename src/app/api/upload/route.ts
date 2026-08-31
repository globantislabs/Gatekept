import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

// POST /api/upload — accepts FormData with `file` and `type` ('image' | 'video' | 'thumbnail')
// Saves to data/uploads/ ONLY (persistent across Plesk git pulls — data/ is gitignored)
// Files are served via GET /api/uploads/[...path] which reads from data/uploads/
// Returns { url: '/uploads/<type>/<filename>' }
//
// UPLOAD_ROOT is set by server.js in production (project root/data/uploads) so
// uploads NEVER land inside .next — `next build` regenerates .next from scratch
// and would otherwise wipe every uploaded video/image on each build.
function resolveUploadRoot(): string {
  if (process.env.UPLOAD_ROOT) return process.env.UPLOAD_ROOT
  const cwd = process.cwd()
  // Safety net: Next standalone boots with cwd inside .next/standalone — climb to project root
  if (path.basename(cwd) === 'standalone' && path.basename(path.dirname(cwd)) === '.next') {
    return path.join(path.dirname(path.dirname(cwd)), 'data', 'uploads')
  }
  return path.join(cwd, 'data', 'uploads')
}

const DATA_UPLOAD_ROOT = resolveUploadRoot()

const MAX_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024,      // 5MB for images
  thumbnail: 2 * 1024 * 1024,  // 2MB for thumbnails
  video: 50 * 1024 * 1024,     // 50MB for videos
  default: 10 * 1024 * 1024,
}

const ALLOWED_MIME: Record<string, string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  thumbnail: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi'],
}

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function writeFileVerify(filepath: string, buffer: Buffer): Promise<boolean> {
  try {
    await fs.writeFile(filepath, buffer)
    const stat = await fs.stat(filepath)
    return stat.size === buffer.length && stat.size > 0
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const type = (formData.get('type') as string) || 'image'

    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'No file provided' }, 400)
    }

    // Validate type
    const uploadType = ['image', 'video', 'thumbnail'].includes(type) ? type : 'default'
    const maxSize = MAX_SIZES[uploadType] || MAX_SIZES.default
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024))
      return jsonResponse({ error: `File too large (max ${mb}MB)` }, 400)
    }

    // Validate MIME
    const allowed = ALLOWED_MIME[uploadType]
    if (allowed && !allowed.includes(file.type)) {
      return jsonResponse({ error: `File type ${file.type} not allowed for ${uploadType}` }, 400)
    }

    // For videos, enforce minimum size (prevent 0-byte corrupt uploads)
    if (uploadType === 'video' && file.size < 1000) {
      return jsonResponse({ error: 'Video file appears corrupt (too small)' }, 400)
    }

    // Generate safe filename
    const ext = path.extname(file.name) || (file.type.split('/')[1] ? '.' + file.type.split('/')[1] : '')
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`
    const subdir = uploadType === 'default' ? 'misc' : uploadType + 's'
    const relPath = `/${subdir}/${safeName}`
    const filename = path.join(subdir, safeName)

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Write to data/uploads/ ONLY — this directory is gitignored and persists across Plesk git pulls
    const dataTarget = path.join(DATA_UPLOAD_ROOT, subdir)
    await ensureDir(dataTarget)
    const dataPath = path.join(DATA_UPLOAD_ROOT, filename)

    const dataOk = await writeFileVerify(dataPath, buffer)

    if (!dataOk) {
      return jsonResponse({ error: 'Failed to save file (write verification failed)' }, 500)
    }

    // Log for debugging
    console.log(`[Upload] Saved ${uploadType}: ${relPath} (${(file.size / 1024).toFixed(1)}KB) -> data/uploads/`)

    return jsonResponse({
      url: `/uploads${relPath}`,
      size: file.size,
      type: file.type,
      saved: { data: dataOk },
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error)
    return jsonResponse({ error: 'Upload failed: ' + (error?.message || 'unknown') }, 500)
  }
}

// GET /api/upload — health check
export async function GET() {
  return jsonResponse({
    status: 'ok',
    message: 'Upload endpoint ready. POST FormData with file + type (image|video|thumbnail).',
    limits: {
      image: '5MB',
      thumbnail: '2MB',
      video: '50MB',
    },
    storage: 'data/uploads/ (persistent, gitignored)',
  })
}
