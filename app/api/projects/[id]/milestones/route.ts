import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireProjectAccess } from '@/lib/auth'
import {
  withAuth,
  readJsonBody,
  badRequest,
  notFound,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

type Params = { id: string }

// GET all milestones for a project
export const GET = withAuth<Params>(
  'GET /api/projects/[id]/milestones',
  async ({ user, params }) => {
    await requireProjectAccess(user.id, params.id)

    const milestones = unwrap(
      'select milestones',
      await supabaseAdmin
        .from('milestones')
        .select('*')
        .eq('project_id', params.id)
        .order('date', { ascending: true })
    )

    return NextResponse.json({ milestones: milestones ?? [] })
  }
)

// POST create a new milestone
export const POST = withAuth<Params>(
  'POST /api/projects/[id]/milestones',
  async ({ request, user, params }) => {
    await requireProjectAccess(user.id, params.id)

    const body = await readJsonBody<{
      name?: string
      date?: string
      type?: string
      status?: string
      description?: string
      meeting_notes?: string
    }>(request)

    const { name, date, type, status, description, meeting_notes } = body

    if (!name || !date || !type) {
      throw badRequest('name, date and type are required')
    }

    const milestone = unwrapRequired(
      'insert milestones',
      await supabaseAdmin
        .from('milestones')
        .insert({
          project_id: params.id,
          name,
          date,
          type,
          status: status || 'upcoming',
          description,
          meeting_notes,
        })
        .select()
        .maybeSingle(),
      'Milestone was not created'
    )

    return NextResponse.json({ milestone }, { status: 201 })
  }
)

// PATCH update a milestone
export const PATCH = withAuth<Params>(
  'PATCH /api/projects/[id]/milestones',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, unknown>>(request)
    const { milestoneId, ...updates } = body

    if (!milestoneId || typeof milestoneId !== 'string') {
      throw badRequest('Milestone ID required')
    }

    // Authorise through the milestone's project rather than trusting the URL.
    const milestone = unwrap<{ id: string; project_id: string }>(
      'select milestones for ownership check',
      await supabaseAdmin
        .from('milestones')
        .select('id, project_id')
        .eq('id', milestoneId)
        .maybeSingle()
    )

    if (!milestone) throw notFound('Milestone not found')

    await requireProjectAccess(user.id, milestone.project_id)

    const updatedMilestone = unwrapRequired(
      'update milestones',
      await supabaseAdmin
        .from('milestones')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
        .select()
        .maybeSingle(),
      'Milestone not found'
    )

    return NextResponse.json({ milestone: updatedMilestone })
  }
)

// DELETE a milestone
export const DELETE = withAuth<Params>(
  'DELETE /api/projects/[id]/milestones',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const milestoneId = searchParams.get('milestoneId')

    if (!milestoneId) throw badRequest('Milestone ID required')

    const milestone = unwrap<{ id: string; project_id: string }>(
      'select milestones for ownership check',
      await supabaseAdmin
        .from('milestones')
        .select('id, project_id')
        .eq('id', milestoneId)
        .maybeSingle()
    )

    if (!milestone) throw notFound('Milestone not found')

    await requireProjectAccess(user.id, milestone.project_id)

    const { error } = await supabaseAdmin
      .from('milestones')
      .delete()
      .eq('id', milestoneId)

    if (error) {
      console.error(
        '[DELETE /api/projects/[id]/milestones] delete failed:',
        error
      )
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
