import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Where users land once a broken session has been cleared. */
const AUTH_ROUTE = '/auth'

/**
 * True when an auth error means the stored session is unusable and cannot be
 * refreshed -- e.g. "Invalid Refresh Token: Refresh Token Not Found". These are
 * unrecoverable without signing out: retrying will keep failing, which is what
 * previously left users stuck on a broken dashboard until they cleared site data.
 */
export function isBrokenSessionError(error: unknown): boolean {
  if (!error) return false

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : ''

  return /refresh token|invalid claim|session (not found|missing|expired)|jwt expired|bad_jwt/i.test(
    message
  )
}

/**
 * Clear the unusable local session and send the user to the auth page.
 *
 * Uses `scope: 'local'` because a global sign-out has to call the auth server
 * with the very refresh token that is already rejected. Clearing locally always
 * succeeds, which is the point: recovery must not depend on the broken token.
 */
export async function recoverFromBrokenSession(
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase ?? createClientComponentClient()

  try {
    await client.auth.signOut({ scope: 'local' })
  } catch (signOutError) {
    // Never let cleanup failure block the redirect.
    console.warn('Local sign-out failed while recovering session:', signOutError)
  }

  if (typeof window !== 'undefined' && window.location.pathname !== AUTH_ROUTE) {
    window.location.replace(AUTH_ROUTE)
  }
}

/**
 * Authenticated fetch wrapper. Gets the current session token
 * and adds it as a Bearer token in the Authorization header.
 *
 * If there is no usable session, the local session is cleared and the user is
 * redirected to sign in rather than being left with silently failing requests.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    if (error) {
      console.error('Failed to read Supabase session:', error)
    }
    await recoverFromBrokenSession(supabase)
    throw new Error('Not authenticated')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${data.session.access_token}`)

  const response = await fetch(url, { ...options, headers })

  // The token was accepted locally but rejected by the API: the session is
  // stale. Recover instead of leaving the caller with an unexplained failure.
  if (response.status === 401) {
    await recoverFromBrokenSession(supabase)
  }

  return response
}
