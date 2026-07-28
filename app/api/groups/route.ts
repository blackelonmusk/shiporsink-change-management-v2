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

const DEFAULT_PROJECT_GROUP_SCORES = {
  group_sentiment: 'neutral',
  influence_level: 5,
  awareness: 50,
  desire: 50,
  knowledge: 50,
  ability: 50,
  reinforcement: 50,
}

type GroupRef = {
  id: string
  name: string
  description?: string
  color: string
} | null

/** Supabase returns embedded rows as either an object or a single-item array. */
function firstGroup(value: unknown): GroupRef {
  if (Array.isArray(value)) return (value[0] as GroupRef) ?? null
  return (value as GroupRef) ?? null
}

/** Confirm a project_groups row belongs to a project the user owns. */
async function requireProjectGroupAccess(
  userId: string,
  projectGroupId: string
) {
  const projectGroup = unwrap<{ project_id: string }>(
    'select project_groups for ownership check',
    await supabaseAdmin
      .from('project_groups')
      .select('project_id')
      .eq('id', projectGroupId)
      .maybeSingle()
  )

  if (!projectGroup) throw notFound('Group link not found')

  await requireProjectAccess(userId, projectGroup.project_id)
}

/** Confirm a stakeholder_groups row belongs to the user. */
async function requireGroupOwnership(userId: string, groupId: string) {
  const group = unwrap<{ id: string }>(
    'select stakeholder_groups for ownership check',
    await supabaseAdmin
      .from('stakeholder_groups')
      .select('id')
      .eq('id', groupId)
      .eq('user_id', userId)
      .maybeSingle()
  )

  if (!group) throw notFound('Group not found')
}

// GET - Fetch all groups for the current user
export const GET = withAuth('GET /api/groups', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId') // Optional: filter by project

  // Groups linked to a specific project, with their project-scoped scores.
  if (projectId) {
    await requireProjectAccess(user.id, projectId)

    const projectGroups = unwrap<Record<string, any>[]>(
      'select project_groups',
      await supabaseAdmin
        .from('project_groups')
        .select(`
        id,
        project_id,
        group_id,
        group_sentiment,
        influence_level,
        awareness,
        desire,
        knowledge,
        ability,
        reinforcement,
        project_notes,
        created_at,
        stakeholder_groups (
          id,
          name,
          description,
          color
        )
      `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
    )

    const flattened = (projectGroups ?? []).map((pg) => {
      const group = firstGroup(pg.stakeholder_groups)
      return {
        id: pg.id,
        project_id: pg.project_id,
        group_id: pg.group_id,
        name: group?.name || '',
        description: group?.description || '',
        color: group?.color || '#6b7280',
        group_sentiment: pg.group_sentiment,
        influence_level: pg.influence_level,
        awareness: pg.awareness,
        desire: pg.desire,
        knowledge: pg.knowledge,
        ability: pg.ability,
        reinforcement: pg.reinforcement,
        project_notes: pg.project_notes,
        created_at: pg.created_at,
      }
    })

    return NextResponse.json(flattened)
  }

  // Otherwise, all global groups for this user
  const groups = unwrap(
    'select stakeholder_groups',
    await supabaseAdmin
      .from('stakeholder_groups')
      .select(`
      id,
      name,
      description,
      color,
      created_at,
      updated_at
    `)
      .eq('user_id', user.id)
      .order('name', { ascending: true })
  )

  return NextResponse.json(groups ?? [])
})

// POST - Create a new group (optionally link to project)
export const POST = withAuth('POST /api/groups', async ({ request, user }) => {
  const body = await readJsonBody<{
    name?: string
    description?: string
    color?: string
    project_id?: string
    group_id?: string
  }>(request)

  const { name, description, color, project_id, group_id } = body

  // Link an existing group to a project.
  if (group_id && project_id) {
    await requireProjectAccess(user.id, project_id)
    await requireGroupOwnership(user.id, group_id)

    const link = unwrapRequired(
      'insert project_groups',
      await supabaseAdmin
        .from('project_groups')
        .insert([{
          project_id,
          group_id,
          ...DEFAULT_PROJECT_GROUP_SCORES,
        }])
        .select()
        .maybeSingle(),
      'Group link was not created'
    )

    return NextResponse.json(link)
  }

  if (!name || !name.trim()) throw badRequest('name is required')

  // Creating a new global group, optionally linked to a project.
  if (project_id) {
    await requireProjectAccess(user.id, project_id)
  }

  const newGroup = unwrapRequired<{ id: string }>(
    'insert stakeholder_groups',
    await supabaseAdmin
      .from('stakeholder_groups')
      .insert([{
        user_id: user.id,
        name,
        description: description || '',
        color: color || '#6b7280',
      }])
      .select()
      .maybeSingle(),
    'Group was not created'
  )

  if (project_id) {
    const { error: linkError } = await supabaseAdmin
      .from('project_groups')
      .insert([{
        project_id,
        group_id: newGroup.id,
        ...DEFAULT_PROJECT_GROUP_SCORES,
      }])

    // The group itself exists; report the link failure without losing it.
    if (linkError) {
      console.error('[POST /api/groups] failed linking group to project:', linkError)
    }
  }

  return NextResponse.json(newGroup)
})

// PATCH - Update group (global or project-specific)
export const PATCH = withAuth('PATCH /api/groups', async ({ request, user }) => {
  const body = await readJsonBody<Record<string, any>>(request)
  const { id, project_group_id } = body

  // Project-scoped scores.
  if (project_group_id) {
    await requireProjectGroupAccess(user.id, project_group_id)

    const projectUpdates: Record<string, unknown> = {}

    if (body.group_sentiment !== undefined) projectUpdates.group_sentiment = body.group_sentiment
    if (body.influence_level !== undefined) projectUpdates.influence_level = body.influence_level
    if (body.awareness !== undefined) projectUpdates.awareness = body.awareness
    if (body.desire !== undefined) projectUpdates.desire = body.desire
    if (body.knowledge !== undefined) projectUpdates.knowledge = body.knowledge
    if (body.ability !== undefined) projectUpdates.ability = body.ability
    if (body.reinforcement !== undefined) projectUpdates.reinforcement = body.reinforcement
    if (body.project_notes !== undefined) projectUpdates.project_notes = body.project_notes

    projectUpdates.updated_at = new Date().toISOString()

    const updated = unwrapRequired(
      'update project_groups',
      await supabaseAdmin
        .from('project_groups')
        .update(projectUpdates)
        .eq('id', project_group_id)
        .select()
        .maybeSingle(),
      'Group link not found'
    )

    return NextResponse.json(updated)
  }

  if (!id) throw badRequest('id or project_group_id required')

  // Otherwise, update global group info.
  const globalUpdates: Record<string, unknown> = {}

  if (body.name !== undefined) globalUpdates.name = body.name
  if (body.description !== undefined) globalUpdates.description = body.description
  if (body.color !== undefined) globalUpdates.color = body.color

  globalUpdates.updated_at = new Date().toISOString()

  const updated = unwrapRequired(
    'update stakeholder_groups',
    await supabaseAdmin
      .from('stakeholder_groups')
      .update(globalUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle(),
    'Group not found'
  )

  return NextResponse.json(updated)
})

// DELETE - Remove group (from project or globally)
export const DELETE = withAuth('DELETE /api/groups', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const projectGroupId = searchParams.get('projectGroupId')

  // Unlink from a project only.
  if (projectGroupId) {
    await requireProjectGroupAccess(user.id, projectGroupId)

    const { error } = await supabaseAdmin
      .from('project_groups')
      .delete()
      .eq('id', projectGroupId)

    if (error) {
      console.error('[DELETE /api/groups] unlink failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }

  // Otherwise, delete the global group (cascades to project_groups).
  if (!id) throw badRequest('id required')

  const { error } = await supabaseAdmin
    .from('stakeholder_groups')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[DELETE /api/groups] delete failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
