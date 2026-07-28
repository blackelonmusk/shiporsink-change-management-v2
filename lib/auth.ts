import { supabaseAdmin } from './supabase'
import { forbidden, unwrap } from './api-errors'
import type { User } from '@supabase/supabase-js'

export type AuthResult = {
  user: User | null
  error: string | null
  /** 200 when authenticated, 401 for any session problem, 503 if auth is down. */
  status: 200 | 401 | 503
}

/**
 * Extract and validate the JWT from the Authorization header.
 * Uses the service role client to verify the token server-side.
 *
 * Any session problem -- header missing, token malformed, expired, revoked --
 * resolves to a 401. Only an unreachable auth service yields 503, so a network
 * blip never causes a client to sign the user out.
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: 'Missing or invalid Authorization header',
      status: 401,
    }
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    return { user: null, error: 'Empty bearer token', status: 401 }
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error) {
      // 5xx from the auth service, or a retryable transport failure, means the
      // service is unhealthy -- not that the caller's session is bad.
      const unreachable =
        error.name === 'AuthRetryableFetchError' ||
        (typeof error.status === 'number' && error.status >= 500)

      return {
        user: null,
        error: error.message,
        status: unreachable ? 503 : 401,
      }
    }

    if (!data.user) {
      return { user: null, error: 'No user for token', status: 401 }
    }

    return { user: data.user, error: null, status: 200 }
  } catch (err) {
    // A thrown error here is a transport failure (DNS, TLS, socket) rather than
    // a rejected token. Treat only clear network failures as "auth is down".
    const message = err instanceof Error ? err.message : String(err)
    const networkFailure =
      /fetch failed|network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket/i.test(
        message
      )

    return {
      user: null,
      error: message,
      status: networkFailure ? 503 : 401,
    }
  }
}

/**
 * Verify that the authenticated user owns the given project.
 *
 * Returns false when the project does not exist or belongs to someone else.
 * A genuine database fault throws (becoming a logged 500) instead of being
 * silently reported as "no access".
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string | null | undefined
): Promise<boolean> {
  if (!projectId) return false

  const project = unwrap<{ id: string }>(
    'verifyProjectOwnership: select change_projects',
    await supabaseAdmin
      .from('change_projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()
  )

  return !!project
}

/** Throw a 403 unless the user owns the project. */
export async function requireProjectAccess(
  userId: string,
  projectId: string | null | undefined
): Promise<void> {
  const hasAccess = await verifyProjectOwnership(userId, projectId)
  if (!hasAccess) throw forbidden()
}
