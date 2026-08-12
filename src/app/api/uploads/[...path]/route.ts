import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat, open } from 'fs/promises'
import path from 'path'
import { createReadStream } from 'fs'

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

    // Build the file path: uploads/{subdir}/{filename}
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments)

    // Security: prevent directory traversal
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if file exists and get stats
    let fileStat
    try {
      fileStat = await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileSize = fileStat.size
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // ─── Handle HTTP Range requests (essential for video playback) ───
    const rangeHeader = request.headers.get('range')

    if (rangeHeader) {
      // Parse range: "bytes=start-end"
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
      if (!match) {
        return NextResponse.json({ error: 'Invalid range' }, { status: 416 })
      }

      const start = parseInt(match[1], 10)
      const end = match[2] ? parseInt(match[2], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1)

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        })
      }

      const contentLength = end - start + 1

      // Read the specific byte range
      const fileHandle = await open(filePath, 'r')
      const buffer = Buffer.alloc(contentLength)
      await fileHandle.read(buffer, 0, contentLength, start)
      await fileHandle.close()

      return new NextResponse(buffer, {
        status: 206, // Partial Content
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
    // For small files (images, etc), load into memory
    // For large files (videos), still load but with proper headers
    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': ext === '.mp4' || ext === '.webm' || ext === '.mov'
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=31536000, immutable',
      },
    })
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

    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let fileStat
    try {
      fileStat = await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
