import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectStakeholderId = searchParams.get('stakeholder_id') || searchParams.get('projectStakeholderId')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!projectStakeholderId) {
    return NextResponse.json({ error: 'stakeholder_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('score_history')
    .select('*')
    .eq('project_stakeholder_id', projectStakeholderId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
