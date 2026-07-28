import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Error primitives shared by API routes and the auth helpers.
 *
 * The rules these enforce:
 *  - A missing, malformed, invalid or expired session is ALWAYS 401 with a JSON
 *    body. It is never allowed to surface as a 500.
 *  - A genuine server fault (database error, unexpected exception) is a 500 with
 *    a generic body, and the underlying error is logged so it shows up in the
 *    Vercel runtime logs.
 *  - Client mistakes stay in the 4xx range (400 bad body, 403 not yours,
 *    404 missing).
 *
 * This module deliberately has no dependency on the auth helpers so that
 * `lib/auth.ts` can use it without creating an import cycle.
 */

/** An error that carries the HTTP status the client should receive. */
export class ApiError extends Error {
  readonly status: number
  readonly logContext?: unknown

  constructor(status: number, message: string, logContext?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.logContext = logContext
  }
}

export const badRequest = (message = 'Bad request') => new ApiError(400, message)

export const forbidden = (message = 'Forbidden') => new ApiError(403, message)

export const notFound = (message = 'Not found') => new ApiError(404, message)

/**
 * Wrap a Supabase/Postgrest error as a 500. The real error is kept in
 * logContext so it reaches the server logs without being sent to the client.
 */
export const databaseError = (operation: string, error: PostgrestError) =>
  new ApiError(500, 'Internal server error', { operation, error })

/**
 * Parse a JSON request body. A missing or malformed body is a client error
 * (400), not a server fault -- previously an empty body threw and became a 500.
 */
export async function readJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw badRequest('Request body must be valid JSON')
  }
}

/**
 * Unwrap a Supabase query result, converting a query error into a logged 500.
 * `.single()` "no rows returned" (PGRST116) is surfaced as `null` rather than an
 * error so callers can decide whether that means 404.
 */
export function unwrap<T>(
  operation: string,
  result: { data: T | null; error: PostgrestError | null }
): T | null {
  if (result.error) {
    if (result.error.code === 'PGRST116') return null
    throw databaseError(operation, result.error)
  }
  return result.data
}

/** Like `unwrap`, but a missing row is a 404. */
export function unwrapRequired<T>(
  operation: string,
  result: { data: T | null; error: PostgrestError | null },
  missingMessage = 'Not found'
): T {
  const data = unwrap(operation, result)
  if (data === null || data === undefined) throw notFound(missingMessage)
  return data
}

/**
 * Next.js signals control flow (dynamic rendering, redirect, notFound) by
 * throwing tagged errors. Those must propagate untouched -- swallowing
 * DYNAMIC_SERVER_USAGE in particular would let a route be misdetected as
 * static at build time.
 */
export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const digest = (error as { digest?: unknown }).digest
  return (
    digest === 'DYNAMIC_SERVER_USAGE' ||
    (typeof digest === 'string' && digest.startsWith('NEXT_'))
  )
}

function logApiError(routeName: string, error: unknown) {
  if (error instanceof ApiError) {
    // 4xx are expected client mistakes; only note them at warn level.
    if (error.status < 500) {
      console.warn(`[${routeName}] ${error.status} ${error.message}`)
      return
    }
    console.error(
      `[${routeName}] ${error.status} ${error.message}`,
      JSON.stringify(error.logContext ?? {}, null, 2)
    )
    return
  }
  console.error(`[${routeName}] Unhandled exception:`, error)
}

/** Convert any thrown value into a JSON response with the right status. */
export function toErrorResponse(routeName: string, error: unknown) {
  if (isNextControlFlowError(error)) throw error

  logApiError(routeName, error)

  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
