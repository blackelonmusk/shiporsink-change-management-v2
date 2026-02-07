import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('change_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  const { data, error } = await supabaseAdmin
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-add "me" stakeholder to new project
  try {
    const { data: meStakeholder } = await supabaseAdmin
      .from('global_stakeholders')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_me', true)
      .single()

    if (meStakeholder) {
      await supabaseAdmin
        .from('project_stakeholders')
        .insert([{
          project_id: data.id,
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
    }
  } catch (autoAddErr) {
    console.error('Auto-add me stakeholder failed (non-fatal):', autoAddErr)
  }

  return NextResponse.json(data)
}
