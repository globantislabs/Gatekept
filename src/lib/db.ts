import { PrismaClient, Prisma } from '@prisma/client'

// Bump this whenever the Prisma schema is regenerated with new/changed
// relations. In dev mode Turbopack re-evaluates this module on file changes,
// and the version mismatch will force us to discard the cached (stale) client
// and create a fresh one that knows about the new schema.
const PRISMA_SCHEMA_VERSION = '2025-09-10-invoice-model-v1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaVersion: string | undefined
  dbConnectionState: 'unknown' | 'connected' | 'disconnected' | 'error'
}

// Invalidate cached client if it was generated against a different schema.
// This is critical in dev mode where Turbopack may re-evaluate this module
// but the global Prisma client singleton was created from an older generated
// client (before a `prisma generate` ran).
if (globalForPrisma.prisma && globalForPrisma.prismaSchemaVersion !== PRISMA_SCHEMA_VERSION) {
  try {
    void globalForPrisma.prisma.$disconnect()
  } catch {
    // ignore
  }
  globalForPrisma.prisma = undefined
}

// ─── Connection State ─────────────────────────────────────────
// Track connection state so API routes can check DB availability
// without making a separate query each time.
let connectionState: 'unknown' | 'connected' | 'disconnected' | 'error' = 'unknown'
let lastConnectionCheck = 0
const CONNECTION_CHECK_INTERVAL = 30_000 // Re-check every 30s if disconnected

export function getDbConnectionState() {
  return connectionState
}

// ─── Prisma Client Initialization ────────────────────────────
// Create the client with retry-friendly settings for production MySQL.
function createPrismaClient(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production'

  return new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['query', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION
}

// ─── Connection Health Check ─────────────────────────────────
// Tests the database connection with a lightweight query.
// Returns diagnostics useful for debugging production issues.
export async function checkDbConnection(): Promise<{
  connected: boolean
  state: string
  latencyMs: number | null
  error: string | null
  database: string
  provider: string
}> {
  const startTime = Date.now()
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  const provider = dbUrl.startsWith('mysql://') ? 'mysql' : dbUrl.startsWith('file:') ? 'sqlite' : 'unknown'

  // Mask credentials in the URL for safe logging
  const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')

  try {
    await db.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - startTime

    connectionState = 'connected'
    lastConnectionCheck = Date.now()

    return {
      connected: true,
      state: 'connected',
      latencyMs,
      error: null,
      database: maskedUrl,
      provider,
    }
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime
    connectionState = 'disconnected'

    let errorMessage = 'Unknown database error'
    if (error instanceof Prisma.PrismaClientInitializationError) {
      errorMessage = `Initialization error: ${error.message} (code: ${error.errorCode})`
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      errorMessage = `Rust panic: ${error.message}`
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error(`[DB Health Check] FAILED (${latencyMs}ms): ${errorMessage}`)
    console.error(`[DB Health Check] DATABASE_URL: ${maskedUrl}`)

    return {
      connected: false,
      state: 'disconnected',
      latencyMs,
      error: errorMessage,
      database: maskedUrl,
      provider,
    }
  }
}

// ─── Safe DB Query Helper ────────────────────────────────────
// Wraps a DB operation with:
//   1. Connection check (skipped if recently verified)
//   2. Automatic retry on connection failure (up to maxRetries)
//   3. Detailed error classification for API responses
export async function safeDbQuery<T>(
  queryFn: (client: PrismaClient) => Promise<T>,
  options: {
    maxRetries?: number
    retryDelayMs?: number
    operationName?: string
  } = {}
): Promise<{
  success: boolean
  data: T | null
  error: {
    type: 'connection' | 'schema' | 'query' | 'unknown'
    message: string
    originalError: unknown
  } | null
}> {
  const { maxRetries = 2, retryDelayMs = 1000, operationName = 'query' } = options
  let lastError: unknown = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Quick connection check if we've been disconnected
      if (connectionState === 'disconnected' || connectionState === 'error') {
        const timeSinceLastCheck = Date.now() - lastConnectionCheck
        if (timeSinceLastCheck > CONNECTION_CHECK_INTERVAL || connectionState === 'unknown') {
          const health = await checkDbConnection()
          if (!health.connected) {
            throw new Error(`Database not available: ${health.error}`)
          }
        }
      }

      const result = await queryFn(db)
      connectionState = 'connected'
      lastConnectionCheck = Date.now()

      return { success: true, data: result, error: null }
    } catch (error: unknown) {
      lastError = error

      // Classify the error
      const classified = classifyError(error)

      // Log with context
      console.error(
        `[DB] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ` +
        `[${classified.type}] ${classified.message}`
      )

      // Only retry on connection errors
      if (classified.type !== 'connection' || attempt === maxRetries) {
        return { success: false, data: null, error: classified }
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)))
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    data: null,
    error: {
      type: 'unknown',
      message: 'Max retries exceeded',
      originalError: lastError,
    },
  }
}

// ─── Error Classification ────────────────────────────────────
// Classifies Prisma errors into categories for better API responses.
function classifyError(error: unknown): {
  type: 'connection' | 'schema' | 'query' | 'unknown'
  message: string
  originalError: unknown
} {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    // P1001: Can't reach database server
    // P1002: Database server reached but timed out
    // P1003: Database does not exist
    return {
      type: 'connection',
      message: `Database connection failed: ${error.message} (code: ${error.errorCode})`,
      originalError: error,
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: Table does not exist (schema mismatch)
    // P2022: Column does not exist (schema mismatch - e.g., qr_code_url missing)
    if (error.errorCode === 'P2021' || error.errorCode === 'P2022') {
      return {
        type: 'schema',
        message: `Schema mismatch: ${error.message} (code: ${error.errorCode})`,
        originalError: error,
      }
    }
    // P2002: Unique constraint violation
    // P2025: Record not found
    return {
      type: 'query',
      message: `Query error: ${error.message} (code: ${error.errorCode})`,
      originalError: error,
    }
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      type: 'connection',
      message: `Database engine error: ${error.message}`,
      originalError: error,
    }
  }

  if (error instanceof Error) {
    // Check for common MySQL/MariaDB connection errors
    const msg = error.message.toLowerCase()
    if (
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('connect econnrefused') ||
      msg.includes('access denied') ||
      msg.includes('unknown column') ||
      msg.includes("doesn't exist")
    ) {
      if (msg.includes('unknown column') || msg.includes("doesn't exist")) {
        return {
          type: 'schema',
          message: `Schema mismatch: ${error.message}`,
          originalError: error,
        }
      }
      return {
        type: 'connection',
        message: `Database connection failed: ${error.message}`,
        originalError: error,
      }
    }

    return {
      type: 'query',
      message: error.message,
      originalError: error,
    }
  }

  return {
    type: 'unknown',
    message: String(error),
    originalError: error,
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────
// Properly disconnect Prisma when the process is actually terminating.
// NOTE: We do NOT use 'beforeExit' because it fires when the event loop
// is empty but the process isn't actually exiting — this causes unnecessary
// disconnections during idle periods in dev mode.
if (typeof process !== 'undefined') {
  const gracefulShutdown = async () => {
    try {
      await db.$disconnect()
      console.log('[DB] Prisma client disconnected gracefully')
    } catch (e) {
      console.error('[DB] Error during disconnect:', e)
    }
    // Exit after cleanup to ensure the process terminates
    process.exit(0)
  }

  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
}
