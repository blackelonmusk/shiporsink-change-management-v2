import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, readJsonBody, badRequest, unwrap } from '@/lib/api-utils'

function parseLimit(raw: string | null, fallback: number) {
  const parsed = Number.parseInt(raw || String(fallback), 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : fallback
}

// GET - Fetch chat insights for a user (optionally filtered by project or stakeholder)
export const GET = withAuth(
  'GET /api/chat-insights',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const stakeholderId = searchParams.get('stakeholderId')
    const limit = parseLimit(searchParams.get('limit'), 50)

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

    const insights = unwrap('select chat_insights', await query)

    return NextResponse.json(insights ?? [])
  }
)

// POST - Save a chat insight
export const POST = withAuth(
  'POST /api/chat-insights',
  async ({ request, user }) => {
    const body = await readJsonBody<{
      project_id?: string | null
      stakeholder_id?: string | null
      insight?: string
      insight_type?: string
    }>(request)

    const { project_id, stakeholder_id, insight, insight_type } = body

    if (!insight) throw badRequest('insight is required')

    const saved = unwrap(
      'insert chat_insights',
      await supabaseAdmin
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
    )

    return NextResponse.json(saved)
  }
)

// DELETE - Delete a specific insight
export const DELETE = withAuth(
  'DELETE /api/chat-insights',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw badRequest('id required')

    const { error } = await supabaseAdmin
      .from('chat_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/chat-insights] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
