import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

// GET - Fetch recent chat messages for a project
export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const limit = parseInt(searchParams.get('limit') || '20')

  let query = supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Save a chat message
export async function POST(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { project_id, role, content } = body

  const { data, error } = await supabaseAdmin
    .from('chat_messages')
    .insert([{
      user_id: user.id,
      project_id,
      role,
      content,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error saving chat message:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - Clear chat history for a project
export async function DELETE(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  let query = supabaseAdmin
    .from('chat_messages')
    .delete()
    .eq('user_id', user.id)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { error } = await query

  if (error) {
    console.error('Error clearing chat history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
