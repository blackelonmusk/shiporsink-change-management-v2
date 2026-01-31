import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  // Get project IDs where user is a member
  const { data: memberships, error: memberError } = await supabaseAdmin
    .from('change_project_members')
    .select('project_id')
    .eq('invited_email', email)

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json([])
  }

  const projectIds = memberships.map(m => m.project_id)

  // Get the actual projects
  const { data: projects, error: projectError } = await supabaseAdmin
    .from('change_projects')
    .select('*')
    .in('id', projectIds)
    .order('created_at', { ascending: false })

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  return NextResponse.json(projects)
}
