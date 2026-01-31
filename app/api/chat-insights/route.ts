import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET - Fetch chat insights for a user (optionally filtered by project or stakeholder)
export async function GET(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const stakeholderId = searchParams.get('stakeholderId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabaseAdmin
    .from('chat_insights')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (stakeholderId) {
    query = query.eq('stakeholder_id', stakeholderId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching chat insights:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Save a chat insight
export async function POST(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { project_id, stakeholder_id, insight, insight_type } = body

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('chat_insights')
    .insert([{
      user_id: user.id,
      project_id: project_id || null,
      stakeholder_id: stakeholder_id || null,
      insight,
      insight_type: insight_type || 'general',
    }])
    .select()
    .single()

  if (error) {
    console.error('Error saving chat insight:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - Delete a specific insight
export async function DELETE(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('chat_insights')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting chat insight:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
