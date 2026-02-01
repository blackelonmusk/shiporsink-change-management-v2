import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Authenticated fetch wrapper. Gets the current session token
 * and adds it as a Bearer token in the Authorization header.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClientComponentClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)

  return fetch(url, { ...options, headers })
}
