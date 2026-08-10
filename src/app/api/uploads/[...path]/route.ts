import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

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

    // Check if file exists
    try {
      await stat(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const buffer = await readFile(filePath)

    // Determine content type from extension
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    // Return the file with proper headers and caching
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[Serve Upload API] Error:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
