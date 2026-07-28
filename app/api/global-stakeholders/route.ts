import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  withAuth,
  readJsonBody,
  badRequest,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

const GROUP_JOIN = `
      *,
      stakeholder_groups (
        id,
        name,
        color
      )
    `

type GroupRef = { id: string; name: string; color: string } | null

/** Supabase returns embedded rows as either an object or a single-item array. */
function firstGroup(value: unknown): GroupRef {
  if (Array.isArray(value)) return (value[0] as GroupRef) ?? null
  return (value as GroupRef) ?? null
}

function withFlattenedGroup<T extends { stakeholder_groups?: unknown }>(row: T) {
  const group = firstGroup(row.stakeholder_groups)
  return {
    ...row,
    group_name: group?.name || null,
    group_color: group?.color || null,
  }
}

// GET - Fetch all global stakeholders for the current user
export const GET = withAuth(
  'GET /api/global-stakeholders',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') // Optional filter

    let query = supabaseAdmin
      .from('global_stakeholders')
      .select(`
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
      created_at,
      updated_at,
      stakeholder_groups (
        id,
        name,
        color
      )
    `)
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const stakeholders = unwrap('select global_stakeholders', await query)

    return NextResponse.json((stakeholders ?? []).map(withFlattenedGroup))
  }
)

// POST - Create a new global stakeholder
export const POST = withAuth(
  'POST /api/global-stakeholders',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request)
    const {
      name,
      email,
      phone,
      role,
      title,
      department,
      location,
      notes,
      group_id,
      org_level,
      reports_to_id,
      is_me,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw badRequest('name is required')
    }

    // Enforce only one is_me per user
    if (is_me) {
      const { error: clearError } = await supabaseAdmin
        .from('global_stakeholders')
        .update({ is_me: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_me', true)

      if (clearError) {
        console.error(
          '[POST /api/global-stakeholders] failed clearing previous is_me:',
          clearError
        )
      }
    }

    const stakeholder = unwrapRequired<Record<string, unknown>>(
      'insert global_stakeholders',
      await supabaseAdmin
        .from('global_stakeholders')
        .insert([{
          user_id: user.id,
          name,
          email: email || '',
          phone: phone || '',
          role: role || '',
          title: title || '',
          department: department || '',
          location: location || '',
          notes: notes || '',
          group_id: group_id || null,
          org_level: org_level || null,
          reports_to_id: reports_to_id || null,
          is_me: is_me || false,
        }])
        .select(GROUP_JOIN)
        .maybeSingle(),
      'Stakeholder was not created'
    )

    return NextResponse.json(withFlattenedGroup(stakeholder))
  }
)

// PATCH - Update a global stakeholder
export const PATCH = withAuth(
  'PATCH /api/global-stakeholders',
  async ({ request, user }) => {
    const body = await readJsonBody<Record<string, any>>(request)
    const {
      id,
      name,
      email,
      phone,
      role,
      title,
      department,
      location,
      notes,
      group_id,
      org_level,
      reports_to_id,
      is_me,
    } = body

    if (!id) throw badRequest('id required')

    // Enforce only one is_me per user
    if (is_me === true) {
      const { error: clearError } = await supabaseAdmin
        .from('global_stakeholders')
        .update({ is_me: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_me', true)
        .neq('id', id)

      if (clearError) {
        console.error(
          '[PATCH /api/global-stakeholders] failed clearing previous is_me:',
          clearError
        )
      }
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (role !== undefined) updates.role = role
    if (title !== undefined) updates.title = title
    if (department !== undefined) updates.department = department
    if (location !== undefined) updates.location = location
    if (notes !== undefined) updates.notes = notes
    if (group_id !== undefined) updates.group_id = group_id
    if (org_level !== undefined) updates.org_level = org_level
    if (reports_to_id !== undefined) updates.reports_to_id = reports_to_id
    if (is_me !== undefined) updates.is_me = is_me

    const stakeholder = unwrapRequired<Record<string, unknown>>(
      'update global_stakeholders',
      await supabaseAdmin
        .from('global_stakeholders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(GROUP_JOIN)
        .maybeSingle(),
      'Stakeholder not found'
    )

    return NextResponse.json(withFlattenedGroup(stakeholder))
  }
)

// DELETE - Delete a global stakeholder (will cascade to project_stakeholders)
export const DELETE = withAuth(
  'DELETE /api/global-stakeholders',
  async ({ request, user }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw badRequest('id required')

    // Check if stakeholder is linked to any projects
    const links = unwrap<{ id: string; project_id: string }[]>(
      'select project_stakeholders for link check',
      await supabaseAdmin
        .from('project_stakeholders')
        .select('id, project_id')
        .eq('stakeholder_id', id)
    )

    if (links && links.length > 0) {
      return NextResponse.json(
        {
          error: `This person is linked to ${links.length} project(s). Remove them from projects first, or use force=true to delete everywhere.`,
          linked_projects: links.length,
        },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('global_stakeholders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/global-stakeholders] delete failed:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  }
)
