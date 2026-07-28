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

const FULL_RECORD_SELECT = `
      *,
      global_stakeholders (
        id, name, email, phone, role, title, department, location, notes, avatar_url, group_id, org_level, reports_to_id, is_me,
        stakeholder_groups (id, name, color)
      )
    `

/** Supabase returns embedded rows as either an object or a single-item array. */
function firstEmbedded<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null
  return (value as T) ?? null
}

type GlobalStakeholder = {
  id: string
  name?: string
  email?: string
  phone?: string
  role?: string
  title?: string
  department?: string
  location?: string
  notes?: string
  avatar_url?: string
  group_id?: string | null
  org_level?: string | null
  reports_to_id?: string | null
  is_me?: boolean
  stakeholder_groups?: unknown
}

type Group = { id: string; name: string; color: string }

/**
 * Flatten a project_stakeholders row joined to its global_stakeholders record
 * into the shape the frontend expects (including legacy aliases).
 */
function flattenStakeholder(ps: Record<string, any>) {
  const gs = firstEmbedded<GlobalStakeholder>(ps.global_stakeholders)
  const group = gs ? firstEmbedded<Group>(gs.stakeholder_groups) : null

  return {
    id: ps.id,
    stakeholder_id: ps.stakeholder_id,
    project_id: ps.project_id,
    // Global info
    name: gs?.name || '',
    email: gs?.email || '',
    phone: gs?.phone || '',
    role: gs?.role || '',
    title: gs?.title || '',
    department: gs?.department || '',
    location: gs?.location || '',
    notes: gs?.notes || '',
    avatar_url: gs?.avatar_url || '',
    // Group info
    group_id: gs?.group_id || null,
    group_name: group?.name || null,
    group_color: group?.color || null,
    // Org hierarchy
    org_level: gs?.org_level || null,
    reports_to_id: gs?.reports_to_id || null,
    is_me: gs?.is_me || false,
    // Project-specific scores
    stakeholder_type: ps.stakeholder_type,
    influence_level: ps.influence_level,
    support_level: ps.support_level,
    engagement_score: ps.engagement_score,
    performance_score: ps.performance_score,
    last_contact_date: ps.last_contact_date,
    project_notes: ps.project_notes,
    comments: ps.project_notes, // Alias for backward compatibility
    // ADKAR scores (project-specific)
    awareness: ps.awareness,
    desire: ps.desire,
    knowledge: ps.knowledge,
    ability: ps.ability,
    reinforcement: ps.reinforcement,
    // Legacy aliases for backward compatibility
    awareness_score: ps.awareness,
    desire_score: ps.desire,
    knowledge_score: ps.knowledge,
    ability_score: ps.ability,
    reinforcement_score: ps.reinforcement,
    created_at: ps.created_at,
    updated_at: ps.updated_at,
  }
}

// GET - Fetch stakeholders for a project (joins global + project data)
export const GET = withAuth(
  'GET /api/stakeholders',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) throw badRequest('projectId required')

    await requireProjectAccess(user.id, projectId)

    const rows = unwrap<Record<string, any>[]>(
      'select project_stakeholders',
      await supabaseAdmin
        .from('project_stakeholders')
        .select(`
      id,
      project_id,
      stakeholder_id,
      stakeholder_type,
      influence_level,
      support_level,
      awareness,
      desire,
      knowledge,
      ability,
      reinforcement,
      engagement_score,
      performance_score,
      last_contact_date,
      project_notes,
      created_at,
      updated_at,
      global_stakeholders (
        id,
        name,
        email,
        phone,
        role,
        title,
        department,
        location,
        notes,
        avatar_url,
        group_id,
        org_level,
        reports_to_id,
        is_me,
        stakeholder_groups (
          id,
          name,
          color
        )
      )
    `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
    )

    return NextResponse.json((rows ?? []).map(flattenStakeholder))
  }
)

// POST - Add a stakeholder to a project
export const POST = withAuth(
  'POST /api/stakeholders',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request)
    const { project_id, stakeholder_id, name, role, email, phone, department } =
      body

    if (!project_id) throw badRequest('project_id required')

    await requireProjectAccess(user.id, project_id)

    let globalStakeholderId: string = stakeholder_id

    // If no existing stakeholder_id, create a new global stakeholder
    if (!globalStakeholderId) {
      if (!name) {
        throw badRequest('name is required when creating a new stakeholder')
      }

      const newGlobal = unwrapRequired<{ id: string }>(
        'insert global_stakeholders',
        await supabaseAdmin
          .from('global_stakeholders')
          .insert([{
            user_id: user.id,
            name,
            role,
            email: email || '',
            phone: phone || '',
            department: department || '',
          }])
          .select()
          .maybeSingle(),
        'Stakeholder was not created'
      )

      globalStakeholderId = newGlobal.id
    } else {
      // Linking an existing person: make sure they belong to this user.
      const owned = unwrap<{ id: string }>(
        'select global_stakeholders for ownership check',
        await supabaseAdmin
          .from('global_stakeholders')
          .select('id')
          .eq('id', globalStakeholderId)
          .eq('user_id', user.id)
          .maybeSingle()
      )

      if (!owned) throw notFound('Stakeholder not found')
    }

    // Create the project_stakeholders link with default scores
    const projectStakeholder = unwrapRequired<{ id: string }>(
      'insert project_stakeholders',
      await supabaseAdmin
        .from('project_stakeholders')
        .insert([{
          project_id,
          stakeholder_id: globalStakeholderId,
          stakeholder_type: 'neutral',
          influence_level: 5,
          support_level: 5,
          awareness: 50,
          desire: 50,
          knowledge: 50,
          ability: 50,
          reinforcement: 50,
          engagement_score: 0,
          performance_score: 0,
        }])
        .select()
        .maybeSingle(),
      'Stakeholder was not linked to the project'
    )

    // Record initial score history (best effort -- never fail the request).
    const { error: historyError } = await supabaseAdmin
      .from('score_history')
      .insert([{
        project_stakeholder_id: projectStakeholder.id,
        engagement_score: 0,
        performance_score: 0,
        awareness: 50,
        desire: 50,
        knowledge: 50,
        ability: 50,
        reinforcement: 50,
      }])

    if (historyError) {
      console.error(
        '[POST /api/stakeholders] initial score history failed (non-fatal):',
        historyError
      )
    }

    // Fetch the full record to return
    const fullRecord = unwrapRequired<Record<string, any>>(
      'select project_stakeholders after insert',
      await supabaseAdmin
        .from('project_stakeholders')
        .select(FULL_RECORD_SELECT)
        .eq('id', projectStakeholder.id)
        .maybeSingle(),
      'Stakeholder not found after creation'
    )

    return NextResponse.json(flattenStakeholder(fullRecord))
  }
)

// PATCH - Update stakeholder (handles both global and project-specific updates)
export const PATCH = withAuth(
  'PATCH /api/stakeholders',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request)
    const { id } = body // This is the project_stakeholders.id

    if (!id) throw badRequest('id required')

    // Fetch current record to get stakeholder_id and ADKAR scores
    const current = unwrap<Record<string, any>>(
      'select project_stakeholders for update',
      await supabaseAdmin
        .from('project_stakeholders')
        .select(
          'id, project_id, stakeholder_id, engagement_score, awareness, desire, knowledge, ability, reinforcement, performance_score'
        )
        .eq('id', id)
        .maybeSingle()
    )

    if (!current) throw notFound('Stakeholder not found')

    await requireProjectAccess(user.id, current.project_id)

    // Separate global updates from project updates
    const globalUpdates: Record<string, unknown> = {}
    const projectUpdates: Record<string, unknown> = {}

    // Global fields (update the person everywhere)
    if (body.name !== undefined) globalUpdates.name = body.name
    if (body.email !== undefined) globalUpdates.email = body.email
    if (body.phone !== undefined) globalUpdates.phone = body.phone
    if (body.role !== undefined) globalUpdates.role = body.role
    if (body.title !== undefined) globalUpdates.title = body.title
    if (body.department !== undefined) globalUpdates.department = body.department
    if (body.notes !== undefined) globalUpdates.notes = body.notes
    if (body.group_id !== undefined) globalUpdates.group_id = body.group_id
    if (body.org_level !== undefined) globalUpdates.org_level = body.org_level
    if (body.reports_to_id !== undefined) globalUpdates.reports_to_id = body.reports_to_id
    if (body.is_me !== undefined) globalUpdates.is_me = body.is_me

    // Project-specific fields
    if (body.stakeholder_type !== undefined) projectUpdates.stakeholder_type = body.stakeholder_type
    if (body.influence_level !== undefined) projectUpdates.influence_level = body.influence_level
    if (body.support_level !== undefined) projectUpdates.support_level = body.support_level
    if (body.engagement_score !== undefined) projectUpdates.engagement_score = body.engagement_score
    // Note: performance_score is auto-calculated from ADKAR scores, ignoring manual updates
    if (body.last_contact_date !== undefined) projectUpdates.last_contact_date = body.last_contact_date
    if (body.project_notes !== undefined) projectUpdates.project_notes = body.project_notes
    if (body.comments !== undefined) projectUpdates.project_notes = body.comments // Alias

    // ADKAR scores (project-specific). Canonical name wins over legacy alias.
    let hasADKARUpdates = false
    const adkarFields = [
      'awareness',
      'desire',
      'knowledge',
      'ability',
      'reinforcement',
    ] as const

    for (const field of adkarFields) {
      const legacy = `${field}_score`
      if (body[field] !== undefined || body[legacy] !== undefined) {
        projectUpdates[field] = body[field] ?? body[legacy]
        hasADKARUpdates = true
      }
    }

    // Auto-calculate performance_score from ADKAR averages if any ADKAR score was updated
    if (hasADKARUpdates) {
      const scores = adkarFields.map(
        (field) =>
          (projectUpdates[field] as number | undefined) ??
          (current[field] as number | undefined) ??
          50
      )
      projectUpdates.performance_score = Math.round(
        scores.reduce((sum, value) => sum + value, 0) / scores.length
      )
    }

    // Update global stakeholder if needed (scoped to this user's records)
    if (Object.keys(globalUpdates).length > 0) {
      globalUpdates.updated_at = new Date().toISOString()

      const { error: globalError } = await supabaseAdmin
        .from('global_stakeholders')
        .update(globalUpdates)
        .eq('id', current.stakeholder_id)
        .eq('user_id', user.id)

      if (globalError) {
        console.error(
          '[PATCH /api/stakeholders] global stakeholder update failed:',
          globalError
        )
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    // Update project stakeholder if needed
    if (Object.keys(projectUpdates).length > 0) {
      projectUpdates.updated_at = new Date().toISOString()

      const { error: projectError } = await supabaseAdmin
        .from('project_stakeholders')
        .update(projectUpdates)
        .eq('id', id)

      if (projectError) {
        console.error(
          '[PATCH /api/stakeholders] project stakeholder update failed:',
          projectError
        )
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }
    }

    // Record score history if engagement or ADKAR scores changed
    if (body.engagement_score !== undefined || hasADKARUpdates) {
      const { error: historyError } = await supabaseAdmin
        .from('score_history')
        .insert([{
          project_stakeholder_id: current.id,
          engagement_score: body.engagement_score ?? current.engagement_score ?? 0,
          performance_score: projectUpdates.performance_score ?? current.performance_score ?? 0,
          awareness: projectUpdates.awareness ?? current.awareness ?? 0,
          desire: projectUpdates.desire ?? current.desire ?? 0,
          knowledge: projectUpdates.knowledge ?? current.knowledge ?? 0,
          ability: projectUpdates.ability ?? current.ability ?? 0,
          reinforcement: projectUpdates.reinforcement ?? current.reinforcement ?? 0,
        }])

      if (historyError) {
        console.error(
          '[PATCH /api/stakeholders] score history failed (non-fatal):',
          historyError
        )
      }
    }

    // Fetch and return updated record
    const updated = unwrapRequired<Record<string, any>>(
      'select project_stakeholders after update',
      await supabaseAdmin
        .from('project_stakeholders')
        .select(FULL_RECORD_SELECT)
        .eq('id', id)
        .maybeSingle(),
      'Stakeholder not found after update'
    )

    return NextResponse.json(flattenStakeholder(updated))
  }
)

// DELETE - Remove stakeholder from project (doesn't delete global record)
export const DELETE = withAuth(
  'DELETE /api/stakeholders',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw badRequest('id required')

    // Verify ownership via the project_stakeholder's project
    const projectStakeholder = unwrap<{ project_id: string }>(
      'select project_stakeholders for ownership check',
      await supabaseAdmin
        .from('project_stakeholders')
        .select('project_id')
        .eq('id', id)
        .maybeSingle()
    )

    if (!projectStakeholder) throw notFound()

    await requireProjectAccess(user.id, projectStakeholder.project_id)

    // Delete from project_stakeholders (not from global_stakeholders)
    const { error } = await supabaseAdmin
      .from('project_stakeholders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/stakeholders] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
