import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Fetch all groups for the current user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId') // Optional: filter by project

  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If projectId provided, get groups that are linked to this project with their scores
  if (projectId) {
    const { data, error } = await supabaseAdmin
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Flatten response - handle both array and object cases
    const flattened = data?.map(pg => {
      const group = Array.isArray(pg.stakeholder_groups)
        ? pg.stakeholder_groups[0]
        : pg.stakeholder_groups
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

  // Otherwise, get all global groups for this user
  const { data, error } = await supabaseAdmin
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create a new group (optionally link to project)
export async function POST(request: Request) {
  const body = await request.json()
  const { name, description, color, project_id, group_id } = body

  const supabaseAuth = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If group_id provided, just link existing group to project
  if (group_id && project_id) {
    const { data, error } = await supabaseAdmin
      .from('project_groups')
      .insert([{
        project_id,
        group_id,
        group_sentiment: 'neutral',
        influence_level: 5,
        awareness: 50,
        desire: 50,
        knowledge: 50,
        ability: 50,
        reinforcement: 50,
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  // Create new global group
  const { data: newGroup, error: groupError } = await supabaseAdmin
    .from('stakeholder_groups')
    .insert([{
      user_id: user.id,
      name,
      description: description || '',
      color: color || '#6b7280',
    }])
    .select()
    .single()

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 })
  }

  // If project_id provided, also link to project
  if (project_id) {
    await supabaseAdmin
      .from('project_groups')
      .insert([{
        project_id,
        group_id: newGroup.id,
        group_sentiment: 'neutral',
        influence_level: 5,
        awareness: 50,
        desire: 50,
        knowledge: 50,
        ability: 50,
        reinforcement: 50,
      }])
  }

  return NextResponse.json(newGroup)
}

// PATCH - Update group (global or project-specific)
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, project_group_id } = body

  // If project_group_id provided, update project-specific scores
  if (project_group_id) {
    const projectUpdates: any = {}
    
    if (body.group_sentiment !== undefined) projectUpdates.group_sentiment = body.group_sentiment
    if (body.influence_level !== undefined) projectUpdates.influence_level = body.influence_level
    if (body.awareness !== undefined) projectUpdates.awareness = body.awareness
    if (body.desire !== undefined) projectUpdates.desire = body.desire
    if (body.knowledge !== undefined) projectUpdates.knowledge = body.knowledge
    if (body.ability !== undefined) projectUpdates.ability = body.ability
    if (body.reinforcement !== undefined) projectUpdates.reinforcement = body.reinforcement
    if (body.project_notes !== undefined) projectUpdates.project_notes = body.project_notes

    projectUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('project_groups')
      .update(projectUpdates)
      .eq('id', project_group_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  // Otherwise, update global group info
  const globalUpdates: any = {}
  
  if (body.name !== undefined) globalUpdates.name = body.name
  if (body.description !== undefined) globalUpdates.description = body.description
  if (body.color !== undefined) globalUpdates.color = body.color

  globalUpdates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('stakeholder_groups')
    .update(globalUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - Remove group (from project or globally)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const projectGroupId = searchParams.get('projectGroupId')

  // If projectGroupId, just unlink from project
  if (projectGroupId) {
    const { error } = await supabaseAdmin
      .from('project_groups')
      .delete()
      .eq('id', projectGroupId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // Otherwise, delete global group (will cascade to project_groups)
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('stakeholder_groups')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
