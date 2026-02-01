import { supabaseAdmin } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Extract and validate JWT token from Authorization header.
 * Uses the service role client to verify the token server-side.
 */
export async function getAuthenticatedUser(
  request: Request
): Promise<{ user: User | null; error: string | null }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.substring(7)

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    return { user, error: null }
  } catch {
    return { user: null, error: 'Token validation failed' }
  }
}

/**
 * Verify that the authenticated user owns the given project.
 * Returns true if the project exists and belongs to the user.
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('change_projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}
