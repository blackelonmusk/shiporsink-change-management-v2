import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch stakeholders for a project (joins global + project data)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  // Join project_stakeholders with global_stakeholders to get full data
  const { data, error } = await supabase
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
        notes,
        avatar_url,
        group_id,
        stakeholder_groups (
          id,
          name,
          color
        )
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching stakeholders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the response to match existing frontend expectations
  const flattenedData = data?.map(ps => {
    const gs = Array.isArray(ps.global_stakeholders)
      ? ps.global_stakeholders[0]
      : ps.global_stakeholders
    const group = gs?.stakeholder_groups
      ? (Array.isArray(gs.stakeholder_groups) ? gs.stakeholder_groups[0] : gs.stakeholder_groups)
      : null

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
      notes: gs?.notes || '',
      avatar_url: gs?.avatar_url || '',
      // Group info
      group_id: gs?.group_id || null,
      group_name: group?.name || null,
      group_color: group?.color || null,
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
  })

  return NextResponse.json(flattenedData)
}

// POST - Add a stakeholder to a project
export async function POST(request: Request) {
  const body = await request.json()
  const { project_id, stakeholder_id, name, role, email, phone, department } = body

  // Get project owner for user_id
  const { data: project } = await supabase
    .from('change_projects')
    .select('user_id')
    .eq('id', project_id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let globalStakeholderId = stakeholder_id

  // If no existing stakeholder_id, create a new global stakeholder
  if (!globalStakeholderId) {
    const { data: newGlobal, error: globalError } = await supabase
      .from('global_stakeholders')
      .insert([{
        user_id: project.user_id,
        name,
        role,
        email: email || '',
        phone: phone || '',
        department: department || '',
      }])
      .select()
      .single()

    if (globalError) {
      console.error('Error creating global stakeholder:', globalError)
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }
    globalStakeholderId = newGlobal.id
  }

  // Create the project_stakeholders link with default scores
  const { data: projectStakeholder, error: linkError } = await supabase
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
    .single()

  if (linkError) {
    console.error('Error linking stakeholder to project:', linkError)
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  // Fetch the full record to return
  const { data: fullRecord } = await supabase
    .from('project_stakeholders')
    .select(`
      *,
      global_stakeholders (
        id, name, email, phone, role, title, department, notes, avatar_url, group_id,
        stakeholder_groups (id, name, color)
      )
    `)
    .eq('id', projectStakeholder.id)
    .single()

  // Flatten for response
  const gs = Array.isArray(fullRecord.global_stakeholders)
    ? fullRecord.global_stakeholders[0]
    : fullRecord.global_stakeholders
  const group = gs?.stakeholder_groups
    ? (Array.isArray(gs.stakeholder_groups) ? gs.stakeholder_groups[0] : gs.stakeholder_groups)
    : null

  const response = {
    id: fullRecord.id,
    stakeholder_id: fullRecord.stakeholder_id,
    project_id: fullRecord.project_id,
    name: gs?.name || '',
    email: gs?.email || '',
    phone: gs?.phone || '',
    role: gs?.role || '',
    department: gs?.department || '',
    group_id: gs?.group_id || null,
    group_name: group?.name || null,
    group_color: group?.color || null,
    stakeholder_type: fullRecord.stakeholder_type,
    influence_level: fullRecord.influence_level,
    support_level: fullRecord.support_level,
    engagement_score: fullRecord.engagement_score,
    performance_score: fullRecord.performance_score,
    awareness: fullRecord.awareness,
    desire: fullRecord.desire,
    knowledge: fullRecord.knowledge,
    ability: fullRecord.ability,
    reinforcement: fullRecord.reinforcement,
    awareness_score: fullRecord.awareness,
    desire_score: fullRecord.desire,
    knowledge_score: fullRecord.knowledge,
    ability_score: fullRecord.ability,
    reinforcement_score: fullRecord.reinforcement,
    created_at: fullRecord.created_at,
  }

  // Record initial score history
  const { error: historyError } = await supabase.from('score_history').insert([{
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
    console.error('Error recording initial score history:', historyError)
  }

  return NextResponse.json(response)
}

// PATCH - Update stakeholder (handles both global and project-specific updates)
export async function PATCH(request: Request) {
  const body = await request.json()
  const { id } = body // This is the project_stakeholders.id

  // Fetch current record to get stakeholder_id and ADKAR scores
  const { data: current } = await supabase
    .from('project_stakeholders')
    .select('id, stakeholder_id, engagement_score, awareness, desire, knowledge, ability, reinforcement, performance_score')
    .eq('id', id)
    .single()

  if (!current) {
    return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 })
  }

  // Separate global updates from project updates
  const globalUpdates: any = {}
  const projectUpdates: any = {}

  // Global fields (update the person everywhere)
  if (body.name !== undefined) globalUpdates.name = body.name
  if (body.email !== undefined) globalUpdates.email = body.email
  if (body.phone !== undefined) globalUpdates.phone = body.phone
  if (body.role !== undefined) globalUpdates.role = body.role
  if (body.title !== undefined) globalUpdates.title = body.title
  if (body.department !== undefined) globalUpdates.department = body.department
  if (body.notes !== undefined) globalUpdates.notes = body.notes
  if (body.group_id !== undefined) globalUpdates.group_id = body.group_id

  // Project-specific fields
  if (body.stakeholder_type !== undefined) projectUpdates.stakeholder_type = body.stakeholder_type
  if (body.influence_level !== undefined) projectUpdates.influence_level = body.influence_level
  if (body.support_level !== undefined) projectUpdates.support_level = body.support_level
  if (body.engagement_score !== undefined) projectUpdates.engagement_score = body.engagement_score
  // Note: performance_score is auto-calculated from ADKAR scores, ignoring manual updates
  if (body.last_contact_date !== undefined) projectUpdates.last_contact_date = body.last_contact_date
  if (body.project_notes !== undefined) projectUpdates.project_notes = body.project_notes
  if (body.comments !== undefined) projectUpdates.project_notes = body.comments // Alias

  // ADKAR scores (project-specific)
  let hasADKARUpdates = false
  if (body.awareness !== undefined || body.awareness_score !== undefined) {
    projectUpdates.awareness = body.awareness ?? body.awareness_score
    hasADKARUpdates = true
  }
  if (body.desire !== undefined || body.desire_score !== undefined) {
    projectUpdates.desire = body.desire ?? body.desire_score
    hasADKARUpdates = true
  }
  if (body.knowledge !== undefined || body.knowledge_score !== undefined) {
    projectUpdates.knowledge = body.knowledge ?? body.knowledge_score
    hasADKARUpdates = true
  }
  if (body.ability !== undefined || body.ability_score !== undefined) {
    projectUpdates.ability = body.ability ?? body.ability_score
    hasADKARUpdates = true
  }
  if (body.reinforcement !== undefined || body.reinforcement_score !== undefined) {
    projectUpdates.reinforcement = body.reinforcement ?? body.reinforcement_score
    hasADKARUpdates = true
  }
  // Legacy aliases
  if (body.awareness_score !== undefined) {
    projectUpdates.awareness = body.awareness_score
    hasADKARUpdates = true
  }
  if (body.desire_score !== undefined) {
    projectUpdates.desire = body.desire_score
    hasADKARUpdates = true
  }
  if (body.knowledge_score !== undefined) {
    projectUpdates.knowledge = body.knowledge_score
    hasADKARUpdates = true
  }
  if (body.ability_score !== undefined) {
    projectUpdates.ability = body.ability_score
    hasADKARUpdates = true
  }
  if (body.reinforcement_score !== undefined) {
    projectUpdates.reinforcement = body.reinforcement_score
    hasADKARUpdates = true
  }

  // Auto-calculate performance_score from ADKAR averages if any ADKAR score was updated
  if (hasADKARUpdates) {
    const awareness = projectUpdates.awareness ?? current.awareness ?? 50
    const desire = projectUpdates.desire ?? current.desire ?? 50
    const knowledge = projectUpdates.knowledge ?? current.knowledge ?? 50
    const ability = projectUpdates.ability ?? current.ability ?? 50
    const reinforcement = projectUpdates.reinforcement ?? current.reinforcement ?? 50
    projectUpdates.performance_score = Math.round((awareness + desire + knowledge + ability + reinforcement) / 5)
  }

  // Update global stakeholder if needed
  if (Object.keys(globalUpdates).length > 0) {
    globalUpdates.updated_at = new Date().toISOString()
    const { error: globalError } = await supabase
      .from('global_stakeholders')
      .update(globalUpdates)
      .eq('id', current.stakeholder_id)

    if (globalError) {
      console.error('Error updating global stakeholder:', globalError)
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }
  }

  // Update project stakeholder if needed
  if (Object.keys(projectUpdates).length > 0) {
    projectUpdates.updated_at = new Date().toISOString()
    const { error: projectError } = await supabase
      .from('project_stakeholders')
      .update(projectUpdates)
      .eq('id', id)

    if (projectError) {
      console.error('Error updating project stakeholder:', projectError)
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }
  }

  // Record score history if engagement or ADKAR scores changed
  if (body.engagement_score !== undefined || hasADKARUpdates) {
    // Insert into score_history using project_stakeholder ID as reference
    const { error: historyError } = await supabase.from('score_history').insert([{
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
      console.error('Error recording score history:', historyError)
    }
  }

  // Fetch and return updated record
  const { data: updated } = await supabase
    .from('project_stakeholders')
    .select(`
      *,
      global_stakeholders (
        id, name, email, phone, role, title, department, notes, avatar_url, group_id,
        stakeholder_groups (id, name, color)
      )
    `)
    .eq('id', id)
    .single()

  const gs = Array.isArray(updated.global_stakeholders)
    ? updated.global_stakeholders[0]
    : updated.global_stakeholders
  const group = gs?.stakeholder_groups
    ? (Array.isArray(gs.stakeholder_groups) ? gs.stakeholder_groups[0] : gs.stakeholder_groups)
    : null

  const response = {
    id: updated.id,
    stakeholder_id: updated.stakeholder_id,
    project_id: updated.project_id,
    name: gs?.name || '',
    email: gs?.email || '',
    phone: gs?.phone || '',
    role: gs?.role || '',
    department: gs?.department || '',
    group_id: gs?.group_id || null,
    group_name: group?.name || null,
    group_color: group?.color || null,
    stakeholder_type: updated.stakeholder_type,
    influence_level: updated.influence_level,
    support_level: updated.support_level,
    engagement_score: updated.engagement_score,
    performance_score: updated.performance_score,
    awareness: updated.awareness,
    desire: updated.desire,
    knowledge: updated.knowledge,
    ability: updated.ability,
    reinforcement: updated.reinforcement,
    awareness_score: updated.awareness,
    desire_score: updated.desire,
    knowledge_score: updated.knowledge,
    ability_score: updated.ability,
    reinforcement_score: updated.reinforcement,
    project_notes: updated.project_notes,
    comments: updated.project_notes,
    updated_at: updated.updated_at,
  }

  return NextResponse.json(response)
}

// DELETE - Remove stakeholder from project (doesn't delete global record)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Delete from project_stakeholders (not from global_stakeholders)
  const { error } = await supabase
    .from('project_stakeholders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing stakeholder from project:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
