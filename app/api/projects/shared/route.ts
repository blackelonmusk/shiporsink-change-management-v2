import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, unwrap } from '@/lib/api-utils'

const ROUTE = 'GET /api/projects/shared'

export const GET = withAuth(ROUTE, async ({ user }) => {
  const email = user.email

  // An account without an email can't have been invited to anything. This is a
  // normal empty state, not an error.
  if (!email) return NextResponse.json([])

  const memberships = unwrap<{ project_id: string }[]>(
    'select change_project_members',
    await supabaseAdmin
      .from('change_project_members')
      .select('project_id')
      .eq('invited_email', email)
  )

  if (!memberships || memberships.length === 0) {
    return NextResponse.json([])
  }

  const projectIds = memberships.map((m) => m.project_id)

  const projects = unwrap(
    'select change_projects by id',
    await supabaseAdmin
      .from('change_projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false })
  )

  return NextResponse.json(projects ?? [])
})
