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

    console.log('Template request:', { templateCategory, projectName, startDate })

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

    if (templateError) {
      console.error('Template fetch error:', templateError)
      throw templateError
    }

    console.log('Template found:', template.name)

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

    if (projectError) {
      console.error('Project creation error:', projectError)
      throw projectError
    }

    console.log('Project created:', project.id)

    // Fetch template stakeholders
    const { data: templateStakeholders, error: stakeholdersError } = await supabase
      .from('template_stakeholders')
      .select('*')
      .eq('template_id', template.id)

    if (stakeholdersError) {
      console.error('Template stakeholders fetch error:', stakeholdersError)
      throw stakeholdersError
    }

    console.log('Template stakeholders found:', templateStakeholders?.length || 0)

    // Create stakeholders
    if (templateStakeholders && templateStakeholders.length > 0) {
      const stakeholdersToInsert = templateStakeholders.map((ts: any) => ({
        project_id: project.id,
        name: ts.name,
        role: ts.role,
        stakeholder_type: ts.stakeholder_type,
        engagement_score: 0,
        performance_score: 0,
        notes: ts.notes
      }))

      console.log('Inserting stakeholders:', stakeholdersToInsert.length)

      const { error: insertStakeholdersError } = await supabase
        .from('stakeholders')
        .insert(stakeholdersToInsert)

      if (insertStakeholdersError) {
        console.error('Stakeholders insert error:', insertStakeholdersError)
        throw insertStakeholdersError
      }

      console.log('Stakeholders inserted successfully')
    }

    // Fetch template milestones
    const { data: templateMilestones, error: milestonesError } = await supabase
      .from('template_milestones')
      .select('*')
      .eq('template_id', template.id)

    if (milestonesError) {
      console.error('Template milestones fetch error:', milestonesError)
      throw milestonesError
    }

    console.log('Template milestones found:', templateMilestones?.length || 0)

    // Create milestones
    if (templateMilestones && templateMilestones.length > 0) {
      const projectStartDate = startDate ? new Date(startDate) : new Date()
      
      const milestonesToInsert = templateMilestones.map((tm: any) => {
        const milestoneDate = new Date(projectStartDate)
        milestoneDate.setDate(milestoneDate.getDate() + tm.days_from_start)
        
        return {
          project_id: project.id,
          name: tm.name,
          description: tm.description,
          date: milestoneDate.toISOString().split('T')[0],
          type: tm.type,
          status: 'upcoming'
        }
      })

      console.log('Inserting milestones:', milestonesToInsert.length)

      const { error: insertMilestonesError } = await supabase
        .from('milestones')
        .insert(milestonesToInsert)

      if (insertMilestonesError) {
        console.error('Milestones insert error:', insertMilestonesError)
        throw insertMilestonesError
      }

      console.log('Milestones inserted successfully')
    }

    return NextResponse.json({
      project,
      message: 'Project created successfully from template'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating project from template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create project from template',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
