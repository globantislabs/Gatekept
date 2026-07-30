import { checkDbConnection, getDbConnectionState } from '@/lib/db'
import { jsonResponse, errorResponse, handleOptions } from '@/lib/api-utils'

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return handleOptions()
}

// GET /api/health - Database and system health check
// Returns detailed diagnostics for debugging production issues.
export async function GET() {
  const startTime = Date.now()

  try {
    // Run database connection check
    const dbHealth = await checkDbConnection()

    const totalMs = Date.now() - startTime

    // Build the response
    const health = {
      status: dbHealth.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTimeMs: totalMs,
      database: {
        connected: dbHealth.connected,
        state: dbHealth.state,
        cachedState: getDbConnectionState(),
        latencyMs: dbHealth.latencyMs,
        provider: dbHealth.provider,
        error: dbHealth.error,
        url: dbHealth.database,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        databaseUrlSet: !!process.env.DATABASE_URL,
        nextauthUrlSet: !!process.env.NEXTAUTH_URL,
        nextauthSecretSet: !!process.env.NEXTAUTH_SECRET,
      },
      version: {
        node: process.version,
        platform: process.platform,
      },
    }

    // Return 503 if database is not connected
    if (!dbHealth.connected) {
      return errorResponse('Service unhealthy: database not connected', 503)
    }

    return jsonResponse(health)
  } catch (error) {
    const totalMs = Date.now() - startTime
    console.error('[API /health] Health check failed:', error)

    return errorResponse(
      `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      503
    )
  }
}
