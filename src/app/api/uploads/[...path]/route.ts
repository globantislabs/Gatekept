import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat, open } from 'fs/promises'
import path from 'path'

// Serve files from data/uploads/ (persistent) with fallback to public/uploads/ (static)
const DATA_UPLOAD_ROOT = path.join(process.cwd(), 'data', 'uploads')
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    // Try data/uploads/ first, then public/uploads/
    const dataFilePath = path.join(DATA_UPLOAD_ROOT, ...pathSegments)
    const publicFilePath = path.join(PUBLIC_UPLOAD_ROOT, ...pathSegments)

    // Security: prevent directory traversal
    const resolvedDataPath = path.resolve(dataFilePath)
    const resolvedPublicPath = path.resolve(publicFilePath)
    if (
      !resolvedDataPath.startsWith(path.resolve(DATA_UPLOAD_ROOT)) &&
      !resolvedPublicPath.startsWith(path.resolve(PUBLIC_UPLOAD_ROOT))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check data/uploads/ first (persistent)
    let filePath: string | null = null
    let fileSize = 0
    try {
      const s = await stat(dataFilePath)
      filePath = dataFilePath
      fileSize = s.size
    } catch {
      // Fallback: try public/uploads/
      try {
        const s = await stat(publicFilePath)
        filePath = publicFilePath
        fileSize = s.size
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return await serveFile(request, filePath, fileSize)
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

    const dataFilePath = path.join(DATA_UPLOAD_ROOT, ...pathSegments)
    const publicFilePath = path.join(PUBLIC_UPLOAD_ROOT, ...pathSegments)

    const resolvedDataPath = path.resolve(dataFilePath)
    const resolvedPublicPath = path.resolve(publicFilePath)
    if (
      !resolvedDataPath.startsWith(path.resolve(DATA_UPLOAD_ROOT)) &&
      !resolvedPublicPath.startsWith(path.resolve(PUBLIC_UPLOAD_ROOT))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let filePath: string | null = null
    let fileSize = 0
    try {
      const s = await stat(dataFilePath)
      filePath = dataFilePath
      fileSize = s.size
    } catch {
      try {
        const s = await stat(publicFilePath)
        filePath = publicFilePath
        fileSize = s.size
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

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
