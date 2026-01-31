import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const stakeholderId = searchParams.get('stakeholderId')
  const upcoming = searchParams.get('upcoming')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabaseAdmin
    .from('scheduled_followups')
    .select(`
      *,
      stakeholder:stakeholders(id, name, role, stakeholder_type)
    `)
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
    query = query
      .eq('completed', false)
      .gte('scheduled_date', today)
      .limit(5)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, stakeholder_id, scheduled_date, title, notes } = body

  const { data, error } = await supabaseAdmin
    .from('scheduled_followups')
    .insert({
      project_id,
      stakeholder_id,
      user_id: user.id,
      scheduled_date,
      title,
      notes: notes || null,
    })
    .select(`
      *,
      stakeholder:stakeholders(id, name, role, stakeholder_type)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, scheduled_date, title, notes, completed } = body

  const updateData: any = {}
  if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date
  if (title !== undefined) updateData.title = title
  if (notes !== undefined) updateData.notes = notes
  if (completed !== undefined) updateData.completed = completed

  const { data, error } = await supabaseAdmin
    .from('scheduled_followups')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('scheduled_followups')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
