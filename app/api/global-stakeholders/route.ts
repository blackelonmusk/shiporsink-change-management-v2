import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

// GET - Fetch all global stakeholders for the current user
export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      notes,
      avatar_url,
      group_id,
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

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten group info - handle both array and object cases
  const flattened = data?.map(s => {
    const group = Array.isArray(s.stakeholder_groups) 
      ? s.stakeholder_groups[0] 
      : s.stakeholder_groups
    return {
      ...s,
      group_name: group?.name || null,
      group_color: group?.color || null,
    }
  })

  return NextResponse.json(flattened)
}

// POST - Create a new global stakeholder
export async function POST(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, phone, role, title, department, notes, group_id } = body

  const { data, error } = await supabaseAdmin
    .from('global_stakeholders')
    .insert([{
      user_id: user.id,
      name,
      email: email || '',
      phone: phone || '',
      role: role || '',
      title: title || '',
      department: department || '',
      notes: notes || '',
      group_id: group_id || null,
    }])
    .select(`
      *,
      stakeholder_groups (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const group = Array.isArray(data.stakeholder_groups) 
    ? data.stakeholder_groups[0] 
    : data.stakeholder_groups

  return NextResponse.json({
    ...data,
    group_name: group?.name || null,
    group_color: group?.color || null,
  })
}

// PATCH - Update a global stakeholder
export async function PATCH(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, name, email, phone, role, title, department, notes, group_id } = body

  const updates: any = { updated_at: new Date().toISOString() }
  
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (phone !== undefined) updates.phone = phone
  if (role !== undefined) updates.role = role
  if (title !== undefined) updates.title = title
  if (department !== undefined) updates.department = department
  if (notes !== undefined) updates.notes = notes
  if (group_id !== undefined) updates.group_id = group_id

  const { data, error } = await supabaseAdmin
    .from('global_stakeholders')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      stakeholder_groups (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const group = Array.isArray(data.stakeholder_groups)
    ? data.stakeholder_groups[0]
    : data.stakeholder_groups

  return NextResponse.json({
    ...data,
    group_name: group?.name || null,
    group_color: group?.color || null,
  })
}

// DELETE - Delete a global stakeholder (will cascade to project_stakeholders)
export async function DELETE(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Check if stakeholder is linked to any projects
  const { data: links } = await supabaseAdmin
    .from('project_stakeholders')
    .select('id, project_id')
    .eq('stakeholder_id', id)

  if (links && links.length > 0) {
    return NextResponse.json({ 
      error: `This person is linked to ${links.length} project(s). Remove them from projects first, or use force=true to delete everywhere.`,
      linked_projects: links.length
    }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('global_stakeholders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
