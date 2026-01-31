import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET - Fetch recent chat messages for a project
export async function GET(request: Request) {
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { project_id, role, content } = body

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
