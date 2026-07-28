import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  withAuth,
  readJsonBody,
  badRequest,
  unwrap,
  unwrapRequired,
} from '@/lib/api-utils'

const ROUTE = 'POST /api/templates/apply'

// POST - Create project from template
export const POST = withAuth(ROUTE, async ({ request, user }) => {
  const body = await readJsonBody<{
    templateCategory?: string
    projectName?: string
    startDate?: string
  }>(request)

  const { templateCategory, projectName, startDate } = body

  if (!templateCategory || !projectName) {
    throw badRequest('templateCategory and projectName are required')
  }

  const template = unwrapRequired<{
    id: string
    name: string
    guidance: string | null
  }>(
    'select templates',
    await supabaseAdmin
      .from('templates')
      .select('*')
      .eq('category', templateCategory)
      .maybeSingle(),
    'Template not found'
  )

  // Create project
  const project = unwrapRequired<{ id: string }>(
    'insert change_projects',
    await supabaseAdmin
      .from('change_projects')
      .insert({
        name: projectName,
        description: template.guidance,
        user_id: user.id,
        status: 'active',
      })
      .select()
      .maybeSingle(),
    'Project was not created'
  )

  // Create stakeholders from the template
  const templateStakeholders =
    unwrap<Record<string, any>[]>(
      'select template_stakeholders',
      await supabaseAdmin
        .from('template_stakeholders')
        .select('*')
        .eq('template_id', template.id)
    ) ?? []

  if (templateStakeholders.length > 0) {
    const stakeholdersToInsert = templateStakeholders.map((ts) => ({
      project_id: project.id,
      name: ts.name,
      role: ts.role,
      stakeholder_type: ts.stakeholder_type,
      engagement_score: 0,
      performance_score: 0,
      notes: ts.notes,
    }))

    const { error: insertStakeholdersError } = await supabaseAdmin
      .from('stakeholders')
      .insert(stakeholdersToInsert)

    if (insertStakeholdersError) {
      console.error(
        `[${ROUTE}] stakeholders insert failed for project ${project.id}:`,
        insertStakeholdersError
      )
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  // Create milestones from the template
  const templateMilestones =
    unwrap<Record<string, any>[]>(
      'select template_milestones',
      await supabaseAdmin
        .from('template_milestones')
        .select('*')
        .eq('template_id', template.id)
    ) ?? []

  if (templateMilestones.length > 0) {
    const parsedStart = startDate ? new Date(startDate) : new Date()
    const projectStartDate = Number.isNaN(parsedStart.getTime())
      ? new Date()
      : parsedStart

    const milestonesToInsert = templateMilestones.map((tm) => {
      const milestoneDate = new Date(projectStartDate)
      milestoneDate.setDate(milestoneDate.getDate() + (tm.days_from_start ?? 0))

      return {
        project_id: project.id,
        name: tm.name,
        description: tm.description,
        date: milestoneDate.toISOString().split('T')[0],
        type: tm.type,
        status: 'upcoming',
      }
    })

    const { error: insertMilestonesError } = await supabaseAdmin
      .from('milestones')
      .insert(milestonesToInsert)

    if (insertMilestonesError) {
      console.error(
        `[${ROUTE}] milestones insert failed for project ${project.id}:`,
        insertMilestonesError
      )
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    {
      project,
      message: 'Project created successfully from template',
    },
    { status: 201 }
  )
})
