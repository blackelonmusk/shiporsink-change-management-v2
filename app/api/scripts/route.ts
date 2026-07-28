import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  withAuth,
  readJsonBody,
  badRequest,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

export const GET = withAuth('GET /api/scripts', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const tag = searchParams.get('tag')
  const stakeholderType = searchParams.get('stakeholderType')

  let query = supabaseAdmin
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

  const scripts = unwrap('select conversation_scripts', await query)

  return NextResponse.json(scripts ?? [])
})

export const POST = withAuth('POST /api/scripts', async ({ request, user }) => {
  const body = await readJsonBody<{
    project_id?: string | null
    title?: string
    content?: string
    tags?: string[]
    stakeholder_type?: string | null
  }>(request)

  const { project_id, title, content, tags, stakeholder_type } = body

  if (!title || !content) {
    throw badRequest('title and content are required')
  }

  const script = unwrapRequired(
    'insert conversation_scripts',
    await supabaseAdmin
      .from('conversation_scripts')
      .insert({
        project_id: project_id ?? null,
        user_id: user.id,
        title,
        content,
        tags: tags || [],
        stakeholder_type: stakeholder_type || null,
      })
      .select()
      .maybeSingle(),
    'Script was not created'
  )

  return NextResponse.json(script)
})

export const PATCH = withAuth('PATCH /api/scripts', async ({ request, user }) => {
  const body = await readJsonBody<{
    id?: string
    title?: string
    content?: string
    tags?: string[]
    stakeholder_type?: string | null
    increment_usage?: boolean
  }>(request)

  const { id, title, content, tags, stakeholder_type, increment_usage } = body

  if (!id) throw badRequest('id required')

  // Usage counter bump. Prefer the RPC; fall back to a read-modify-write if the
  // function isn't installed. Ownership is enforced on the fallback update.
  if (increment_usage) {
    const { error: rpcError } = await supabaseAdmin.rpc(
      'increment_script_usage',
      { script_id: id }
    )

    if (rpcError) {
      console.warn(
        '[PATCH /api/scripts] increment_script_usage RPC unavailable, falling back:',
        rpcError.message
      )

      const script = unwrap<{ times_used: number | null }>(
        'select conversation_scripts for usage bump',
        await supabaseAdmin
          .from('conversation_scripts')
          .select('times_used')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      )

      if (script) {
        const { error: bumpError } = await supabaseAdmin
          .from('conversation_scripts')
          .update({
            times_used: (script.times_used || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)

        if (bumpError) {
          console.error('[PATCH /api/scripts] usage bump failed:', bumpError)
        }
      }
    }

    return NextResponse.json({ success: true })
  }

  // Regular update
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (tags !== undefined) updateData.tags = tags
  if (stakeholder_type !== undefined) {
    updateData.stakeholder_type = stakeholder_type
  }

  const script = unwrapRequired(
    'update conversation_scripts',
    await supabaseAdmin
      .from('conversation_scripts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle(),
    'Script not found'
  )

  return NextResponse.json(script)
})

export const DELETE = withAuth(
  'DELETE /api/scripts',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw badRequest('id required')

    const { error } = await supabaseAdmin
      .from('conversation_scripts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/scripts] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
