import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST - Create project from template
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateCategory, projectName, startDate } = body

    if (!templateCategory || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('category', templateCategory)
      .single()

    if (templateError) throw templateError

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        description: template.guidance,
        user_id: session.user.id,
        status: 'active'
      })
      .select()
      .single()

    if (projectError) throw projectError

    // Fetch and create stakeholders
    const { data: templateStakeholders, error: stakeholdersError } = await supabase
      .from('template_stakeholders')
      .select('*')
      .eq('template_id', template.id)

    if (stakeholdersError) throw stakeholdersError

    const stakeholdersToInsert = templateStakeholders.map((ts: any) => ({
      project_id: project.id,
      name: ts.name,
      role: ts.role,
      stakeholder_type: ts.stakeholder_type,
      engagement_score: 0,
      performance_score: 0,
      notes: ts.notes
    }))

    const { error: insertStakeholdersError } = await supabase
      .from('stakeholders')
      .insert(stakeholdersToInsert)

    if (insertStakeholdersError) throw insertStakeholdersError

    // Fetch and create milestones
    const { data: templateMilestones, error: milestonesError } = await supabase
      .from('template_milestones')
      .select('*')
      .eq('template_id', template.id)

    if (milestonesError) throw milestonesError

    // Calculate milestone dates based on start date
    const projectStartDate = startDate ? new Date(startDate) : new Date()
    
    const milestonesToInsert = templateMilestones.map((tm: any) => {
      const milestoneDate = new Date(projectStartDate)
      milestoneDate.setDate(milestoneDate.getDate() + tm.days_from_start)
      
      return {
        project_id: project.id,
        name: tm.name,
        description: tm.description,
        date: milestoneDate.toISOString().split('T')[0], // YYYY-MM-DD format
        type: tm.type,
        status: 'upcoming'
      }
    })

    const { error: insertMilestonesError } = await supabase
      .from('milestones')
      .insert(milestonesToInsert)

    if (insertMilestonesError) throw insertMilestonesError

    return NextResponse.json({ 
      project,
      message: 'Project created successfully from template' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating project from template:', error)
    return NextResponse.json(
      { error: 'Failed to create project from template' },
      { status: 500 }
    )
  }
}
