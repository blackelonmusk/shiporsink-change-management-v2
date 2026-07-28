import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireProjectAccess } from '@/lib/auth'
import {
  withAuth,
  readJsonBody,
  badRequest,
  notFound,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

export const GET = withAuth('GET /api/team', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) throw badRequest('projectId required')

  await requireProjectAccess(user.id, projectId)

  const members = unwrap(
    'select change_project_members',
    await supabaseAdmin
      .from('change_project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
  )

  return NextResponse.json(members ?? [])
})

export const POST = withAuth('POST /api/team', async ({ request, user }) => {
  const body = await readJsonBody<{
    project_id?: string
    invited_email?: string
  }>(request)

  const { project_id, invited_email } = body

  if (!project_id || !invited_email) {
    throw badRequest('project_id and invited_email are required')
  }

  await requireProjectAccess(user.id, project_id)

  // Check if already invited
  const existing = unwrap<{ id: string }>(
    'select change_project_members for duplicate check',
    await supabaseAdmin
      .from('change_project_members')
      .select('id')
      .eq('project_id', project_id)
      .eq('invited_email', invited_email)
      .maybeSingle()
  )

  if (existing) throw badRequest('Already invited')

  const member = unwrapRequired(
    'insert change_project_members',
    await supabaseAdmin
      .from('change_project_members')
      .insert([{ project_id, invited_email }])
      .select()
      .maybeSingle(),
    'Invite was not created'
  )

  return NextResponse.json(member)
})

export const DELETE = withAuth('DELETE /api/team', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) throw badRequest('id required')

  // Verify ownership via the member's project
  const member = unwrap<{ project_id: string }>(
    'select change_project_members for ownership check',
    await supabaseAdmin
      .from('change_project_members')
      .select('project_id')
      .eq('id', id)
      .maybeSingle()
  )

  if (!member) throw notFound()

  await requireProjectAccess(user.id, member.project_id)

  const { error } = await supabaseAdmin
    .from('change_project_members')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DELETE /api/team] delete failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
