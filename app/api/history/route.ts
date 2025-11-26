import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stakeholderId = searchParams.get('stakeholderId')

  if (!stakeholderId) {
    return NextResponse.json({ error: 'stakeholderId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('score_history')
    .select('*')
    .eq('stakeholder_id', stakeholderId)
    .order('recorded_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
