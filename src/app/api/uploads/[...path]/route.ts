import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat, open } from 'fs/promises'
import path from 'path'

// Serve files from data/uploads/ (persistent) with fallback to public/uploads/ (static)
// UPLOAD_ROOT (set by server.js) anchors storage to the PROJECT ROOT so builds
// that regenerate .next can never delete uploaded videos/images.
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
// Legacy locations kept as read fallbacks (older builds stored uploads relative to cwd)
const LEGACY_UPLOAD_ROOT = path.join(process.cwd(), 'data', 'uploads')
const PUBLIC_UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')

// MIME type map for common extensions
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
}

// Chunk size for streaming video (1MB)
const CHUNK_SIZE = 1024 * 1024

// ─── Internal helper: locate an uploaded file across storage roots ───
// Order: active data/uploads (project-root anchored) → legacy cwd data/uploads → public/uploads
async function findUploadFile(...pathSegments: string[]): Promise<{ filePath: string; fileSize: number } | null> {
  const candidates = [DATA_UPLOAD_ROOT, LEGACY_UPLOAD_ROOT, PUBLIC_UPLOAD_ROOT]
  for (const root of candidates) {
    const candidatePath = path.join(root, ...pathSegments)
    // Security: prevent directory traversal
    if (!path.resolve(candidatePath).startsWith(path.resolve(root))) continue
    try {
      const s = await stat(candidatePath)
      return { filePath: candidatePath, fileSize: s.size }
    } catch {
      // try next root
    }
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    // Try data/uploads/ first, then legacy cwd uploads, then public/uploads/
    const found = await findUploadFile(...pathSegments)
    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return await serveFile(request, found.filePath, found.fileSize)
  } catch (error) {
    console.error('[Serve Upload API] Error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}

// Handle HEAD requests for video probing
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    const found = await findUploadFile(...pathSegments)
    if (!found) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const filePath = found.filePath
    const fileSize = found.fileSize

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// ─── Internal helper: serve a file with Range support ───
async function serveFile(request: NextRequest, filePath: string, fileSize: number): Promise<NextResponse> {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  // ─── Handle HTTP Range requests (essential for video playback) ───
  const rangeHeader = request.headers.get('range')

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 416 })
    }

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1)

    if (start >= fileSize || end >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      })
    }

    const contentLength = end - start + 1
    const fileHandle = await open(filePath, 'r')
    const buffer = Buffer.alloc(contentLength)
    await fileHandle.read(buffer, 0, contentLength, start)
    await fileHandle.close()

    return new NextResponse(buffer, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength.toString(),
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  // ─── Non-range request: serve full file ───
  const buffer = await readFile(filePath)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
