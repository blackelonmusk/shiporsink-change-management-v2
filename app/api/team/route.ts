import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
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
  const body = await request.json()
  const { project_id, invited_email } = body

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
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
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
