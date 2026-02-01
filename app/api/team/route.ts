import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, verifyProjectOwnership } from '@/lib/auth'

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const hasAccess = await verifyProjectOwnership(user.id, projectId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('change_project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

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
  const { project_id, invited_email } = body

  const hasAccess = await verifyProjectOwnership(user.id, project_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if already invited
  const { data: existing } = await supabaseAdmin
    .from('change_project_members')
    .select('id')
    .eq('project_id', project_id)
    .eq('invited_email', invited_email)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already invited' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('change_project_members')
    .insert([
      {
        project_id,
        invited_email,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Verify ownership via the member's project
  const { data: member } = await supabaseAdmin
    .from('change_project_members')
    .select('project_id')
    .eq('id', id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const hasAccess = await verifyProjectOwnership(user.id, member.project_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('change_project_members')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
