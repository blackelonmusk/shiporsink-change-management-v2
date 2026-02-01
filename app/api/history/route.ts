import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectStakeholderId = searchParams.get('stakeholder_id') || searchParams.get('projectStakeholderId')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!projectStakeholderId) {
    return NextResponse.json({ error: 'stakeholder_id required' }, { status: 400 })
  }

  // Verify the project_stakeholder belongs to a project owned by this user
  const { data: ps } = await supabaseAdmin
    .from('project_stakeholders')
    .select('project_id')
    .eq('id', projectStakeholderId)
    .single()

  if (!ps) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: project } = await supabaseAdmin
    .from('change_projects')
    .select('id')
    .eq('id', ps.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('score_history')
    .select('*')
    .eq('project_stakeholder_id', projectStakeholderId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
