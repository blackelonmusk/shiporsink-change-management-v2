import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireProjectAccess } from '@/lib/auth'
import {
  withAuth,
  readJsonBody,
  badRequest,
  unwrapRequired,
} from '@/lib/api-utils'

type Params = { id: string }

export const GET = withAuth<Params>(
  'GET /api/projects/[id]',
  async ({ user, params }) => {
    await requireProjectAccess(user.id, params.id)

    const project = unwrapRequired(
      'select change_projects by id',
      await supabaseAdmin
        .from('change_projects')
        .select('*')
        .eq('id', params.id)
        .maybeSingle(),
      'Project not found'
    )

    return NextResponse.json(project)
  }
)

export const PATCH = withAuth<Params>(
  'PATCH /api/projects/[id]',
  async ({ request, user, params }) => {
    await requireProjectAccess(user.id, params.id)

    const body = await readJsonBody<{
      name?: string
      description?: string
      status?: string
      logo_url?: string
    }>(request)

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url

    if (Object.keys(updateData).length === 0) {
      throw badRequest('No updatable fields provided')
    }

    const project = unwrapRequired(
      'update change_projects',
      await supabaseAdmin
        .from('change_projects')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .maybeSingle(),
      'Project not found'
    )

    return NextResponse.json(project)
  }
)

export const DELETE = withAuth<Params>(
  'DELETE /api/projects/[id]',
  async ({ user, params }) => {
    await requireProjectAccess(user.id, params.id)

    const { error } = await supabaseAdmin
      .from('change_projects')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('[DELETE /api/projects/[id]] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
