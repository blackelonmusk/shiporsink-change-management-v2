import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, readJsonBody, badRequest, unwrap } from '@/lib/api-utils'

function parseLimit(raw: string | null, fallback: number) {
  const parsed = Number.parseInt(raw || String(fallback), 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : fallback
}

// GET - Fetch recent chat messages for a project
export const GET = withAuth(
  'GET /api/chat-messages',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = parseLimit(searchParams.get('limit'), 20)

    let query = supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const messages = unwrap('select chat_messages', await query)

    return NextResponse.json(messages ?? [])
  }
)

// POST - Save a chat message
export const POST = withAuth(
  'POST /api/chat-messages',
  async ({ request, user }) => {
    const body = await readJsonBody<{
      project_id?: string | null
      role?: string
      content?: string
    }>(request)

    const { project_id, role, content } = body

    if (!role || !content) {
      throw badRequest('role and content are required')
    }

    const message = unwrap(
      'insert chat_messages',
      await supabaseAdmin
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          project_id: project_id ?? null,
          role,
          content,
        }])
        .select()
        .single()
    )

    return NextResponse.json(message)
  }
)

// DELETE - Clear chat history for a project
export const DELETE = withAuth(
  'DELETE /api/chat-messages',
  async ({ request, user }) => {
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
      console.error('[DELETE /api/chat-messages] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
