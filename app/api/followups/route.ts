import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  withAuth,
  readJsonBody,
  badRequest,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

const STAKEHOLDER_JOIN = `
      *,
      stakeholder:stakeholders(id, name, role, stakeholder_type)
    `

export const GET = withAuth('GET /api/followups', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const stakeholderId = searchParams.get('stakeholderId')
  const upcoming = searchParams.get('upcoming')

  let query = supabaseAdmin
    .from('scheduled_followups')
    .select(STAKEHOLDER_JOIN)
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: true })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (stakeholderId) {
    query = query.eq('stakeholder_id', stakeholderId)
  }

  // Get only upcoming (not completed, date >= today)
  if (upcoming === 'true') {
    const today = new Date().toISOString().split('T')[0]
    query = query.eq('completed', false).gte('scheduled_date', today).limit(5)
  }

  const followups = unwrap('select scheduled_followups', await query)

  return NextResponse.json(followups ?? [])
})

export const POST = withAuth('POST /api/followups', async ({ request, user }) => {
  const body = await readJsonBody<{
    project_id?: string
    stakeholder_id?: string
    scheduled_date?: string
    title?: string
    notes?: string | null
  }>(request)

  const { project_id, stakeholder_id, scheduled_date, title, notes } = body

  if (!scheduled_date || !title) {
    throw badRequest('scheduled_date and title are required')
  }

  const followup = unwrapRequired(
    'insert scheduled_followups',
    await supabaseAdmin
      .from('scheduled_followups')
      .insert({
        project_id,
        stakeholder_id,
        user_id: user.id,
        scheduled_date,
        title,
        notes: notes || null,
      })
      .select(STAKEHOLDER_JOIN)
      .maybeSingle(),
    'Follow-up was not created'
  )

  return NextResponse.json(followup)
})

export const PATCH = withAuth(
  'PATCH /api/followups',
  async ({ request, user }) => {
    const body = await readJsonBody<{
      id?: string
      scheduled_date?: string
      title?: string
      notes?: string | null
      completed?: boolean
    }>(request)

    const { id, scheduled_date, title, notes, completed } = body

    if (!id) throw badRequest('id required')

    const updateData: Record<string, unknown> = {}
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date
    if (title !== undefined) updateData.title = title
    if (notes !== undefined) updateData.notes = notes
    if (completed !== undefined) updateData.completed = completed

    if (Object.keys(updateData).length === 0) {
      throw badRequest('No updatable fields provided')
    }

    // Scoped to user_id, so a row belonging to someone else simply isn't found.
    const followup = unwrapRequired(
      'update scheduled_followups',
      await supabaseAdmin
        .from('scheduled_followups')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle(),
      'Follow-up not found'
    )

    return NextResponse.json(followup)
  }
)

export const DELETE = withAuth(
  'DELETE /api/followups',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw badRequest('id required')

    const { error } = await supabaseAdmin
      .from('scheduled_followups')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/followups] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
