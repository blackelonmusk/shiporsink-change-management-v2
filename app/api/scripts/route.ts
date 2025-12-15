import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const tag = searchParams.get('tag')
  const stakeholderType = searchParams.get('stakeholderType')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = supabase
    .from('conversation_scripts')
    .select('*')
    .eq('user_id', user.id)
    .order('times_used', { ascending: false })
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (stakeholderType) {
    query = query.eq('stakeholder_type', stakeholderType)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, title, content, tags, stakeholder_type } = body

  const { data, error } = await supabase
    .from('conversation_scripts')
    .insert({
      project_id,
      user_id: user.id,
      title,
      content,
      tags: tags || [],
      stakeholder_type: stakeholder_type || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, title, content, tags, stakeholder_type, increment_usage } = body

  // If incrementing usage
  if (increment_usage) {
    const { data, error } = await supabase.rpc('increment_script_usage', { script_id: id })
    
    // Fallback if RPC doesn't exist
    if (error) {
      const { data: script } = await supabase
        .from('conversation_scripts')
        .select('times_used')
        .eq('id', id)
        .single()
      
      await supabase
        .from('conversation_scripts')
        .update({ 
          times_used: (script?.times_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  }

  // Regular update
  const updateData: any = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (tags !== undefined) updateData.tags = tags
  if (stakeholder_type !== undefined) updateData.stakeholder_type = stakeholder_type

  const { data, error } = await supabase
    .from('conversation_scripts')
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
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('conversation_scripts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
