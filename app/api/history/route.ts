import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireProjectAccess } from '@/lib/auth'
import { withAuth, badRequest, notFound, unwrap } from '@/lib/api-utils'

export const GET = withAuth('GET /api/history', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectStakeholderId =
    searchParams.get('stakeholder_id') ||
    searchParams.get('projectStakeholderId')

  const parsedLimit = Number.parseInt(searchParams.get('limit') || '100', 10)
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 500)
    : 100

  if (!projectStakeholderId) throw badRequest('stakeholder_id required')

  // Verify the project_stakeholder belongs to a project owned by this user.
  const projectStakeholder = unwrap<{ project_id: string }>(
    'select project_stakeholders for ownership check',
    await supabaseAdmin
      .from('project_stakeholders')
      .select('project_id')
      .eq('id', projectStakeholderId)
      .maybeSingle()
  )

  if (!projectStakeholder) throw notFound()

  await requireProjectAccess(user.id, projectStakeholder.project_id)

  const history = unwrap(
    'select score_history',
    await supabaseAdmin
      .from('score_history')
      .select('*')
      .eq('project_stakeholder_id', projectStakeholderId)
      .order('recorded_at', { ascending: false })
      .limit(limit)
  )

  return NextResponse.json(history ?? [])
})
