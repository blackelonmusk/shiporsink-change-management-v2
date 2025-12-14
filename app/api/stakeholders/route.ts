import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('stakeholders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { project_id, name, role } = body

  const { data, error } = await supabase
    .from('stakeholders')
    .insert([
      {
        project_id,
        name,
        role,
        engagement_score: 0,
        performance_score: 0,
        comments: '',
        email: '',
        phone: '',
        // ADKAR scores - default to 50 (neutral starting point)
        awareness_score: 50,
        desire_score: 50,
        knowledge_score: 50,
        ability_score: 50,
        reinforcement_score: 50,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('score_history').insert([
    {
      stakeholder_id: data.id,
      engagement_score: 0,
      performance_score: 0,
    },
  ])

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { 
    id, 
    engagement_score, 
    performance_score, 
    comments, 
    name, 
    role, 
    email, 
    phone,
    // ADKAR scores
    awareness_score,
    desire_score,
    knowledge_score,
    ability_score,
    reinforcement_score,
  } = body

  const updateData: any = {}
  
  // Basic fields
  if (engagement_score !== undefined) updateData.engagement_score = engagement_score
  if (performance_score !== undefined) updateData.performance_score = performance_score
  if (comments !== undefined) updateData.comments = comments
  if (name !== undefined) updateData.name = name
  if (role !== undefined) updateData.role = role
  if (email !== undefined) updateData.email = email
  if (phone !== undefined) updateData.phone = phone
  if (body.stakeholder_type !== undefined) updateData.stakeholder_type = body.stakeholder_type
  
  // ADKAR scores
  if (awareness_score !== undefined) updateData.awareness_score = awareness_score
  if (desire_score !== undefined) updateData.desire_score = desire_score
  if (knowledge_score !== undefined) updateData.knowledge_score = knowledge_score
  if (ability_score !== undefined) updateData.ability_score = ability_score
  if (reinforcement_score !== undefined) updateData.reinforcement_score = reinforcement_score

  const { data, error } = await supabase
    .from('stakeholders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (engagement_score !== undefined || performance_score !== undefined) {
    await supabase.from('score_history').insert([
      {
        stakeholder_id: id,
        engagement_score: engagement_score ?? data.engagement_score,
        performance_score: performance_score ?? data.performance_score,
      },
    ])
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('stakeholders')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
