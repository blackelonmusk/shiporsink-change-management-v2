import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, readJsonBody, badRequest, unwrap } from '@/lib/api-utils'

const ROUTE = 'GET /api/projects'

export const GET = withAuth(ROUTE, async ({ user }) => {
  const projects = unwrap(
    'select change_projects',
    await supabaseAdmin
      .from('change_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  )

  return NextResponse.json(projects ?? [])
})

export const POST = withAuth('POST /api/projects', async ({ request, user }) => {
  const body = await readJsonBody<{ name?: unknown }>(request)
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  if (!name) throw badRequest('Project name is required')

  const project = unwrap<{ id: string }>(
    'insert change_projects',
    await supabaseAdmin
      .from('change_projects')
      .insert([
        {
          name,
          user_id: user.id,
          status: 'active',
          description: '',
        },
      ])
      .select()
      .single()
  )

  if (!project) {
    // Insert reported success but returned nothing -- a genuine server fault.
    console.error('[POST /api/projects] insert returned no row')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  // Auto-add the user's "me" stakeholder to the new project. Best effort: a
  // failure here must not fail project creation.
  try {
    const { data: meStakeholder } = await supabaseAdmin
      .from('global_stakeholders')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_me', true)
      .maybeSingle()

    if (meStakeholder) {
      const { error: linkError } = await supabaseAdmin
        .from('project_stakeholders')
        .insert([{
          project_id: project.id,
          stakeholder_id: meStakeholder.id,
          stakeholder_type: 'champion',
          influence_level: 8,
          support_level: 10,
          awareness: 100,
          desire: 100,
          knowledge: 80,
          ability: 80,
          reinforcement: 50,
          engagement_score: 0,
          performance_score: 82,
        }])

      if (linkError) {
        console.error(
          '[POST /api/projects] Auto-add me stakeholder failed (non-fatal):',
          linkError
        )
      }
    }
  } catch (autoAddErr) {
    console.error(
      '[POST /api/projects] Auto-add me stakeholder threw (non-fatal):',
      autoAddErr
    )
  }

  return NextResponse.json(project)
})
