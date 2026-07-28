import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getAuthenticatedUser } from './auth'
import { toErrorResponse, isNextControlFlowError } from './api-errors'

// Re-exported so route handlers only need a single import.
export {
  ApiError,
  badRequest,
  forbidden,
  notFound,
  databaseError,
  readJsonBody,
  unwrap,
  unwrapRequired,
  toErrorResponse,
} from './api-errors'

type RouteContext<P> = { params: P }

type AuthedHandler<P> = (args: {
  request: Request
  user: User
  params: P
}) => Promise<NextResponse>

/**
 * Wrap a route handler so that:
 *  - the caller is authenticated before the handler runs (401, or 503 only if
 *    the auth service itself is unreachable),
 *  - every throw inside the handler becomes a correctly-classified JSON
 *    response with the underlying cause logged, instead of an opaque 500.
 *
 * Auth uses the Bearer token sent by the client and is verified server-side
 * with the service role key; route handlers never talk to Supabase as the user.
 */
export function withAuth<P = Record<string, never>>(
  routeName: string,
  handler: AuthedHandler<P>
) {
  return async function wrappedHandler(
    request: Request,
    context?: RouteContext<P>
  ): Promise<NextResponse> {
    let user: User

    try {
      const auth = await getAuthenticatedUser(request)

      if (!auth.user) {
        if (auth.status === 503) {
          console.error(`[${routeName}] Auth service unavailable: ${auth.error}`)
          return NextResponse.json(
            { error: 'Authentication service unavailable' },
            { status: 503 }
          )
        }
        console.warn(`[${routeName}] 401 ${auth.error ?? 'Unauthorized'}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      user = auth.user
    } catch (error) {
      // Next's dynamic-rendering signal must not be treated as an auth failure.
      if (isNextControlFlowError(error)) throw error

      // getAuthenticatedUser is defensive, but never let an auth problem
      // become a 500 for the client.
      console.error(`[${routeName}] Auth check threw unexpectedly:`, error)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      return await handler({
        request,
        user,
        params: (context?.params ?? {}) as P,
      })
    } catch (error) {
      return toErrorResponse(routeName, error)
    }
  }
}
