import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, unwrap } from '@/lib/api-utils'

const ROUTE = 'GET /api/ai-context'

export const GET = withAuth(ROUTE, async ({ user }) => {
  // Fetch all projects for this user
  const projects =
    unwrap<{
      id: string
      name: string
      status: string
      description: string | null
      created_at: string
    }[]>(
      'select change_projects',
      await supabaseAdmin
        .from('change_projects')
        .select('id, name, status, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ) ?? []

  // Fetch all global stakeholders with their groups
  const globalStakeholders =
    unwrap<Record<string, any>[]>(
      'select global_stakeholders',
      await supabaseAdmin
        .from('global_stakeholders')
        .select(`
        id,
        name,
        email,
        role,
        title,
        department,
        notes,
        group_id,
        org_level,
        reports_to_id,
        is_me,
        stakeholder_groups (
          id,
          name,
          color
        )
      `)
        .eq('user_id', user.id)
    ) ?? []

  // Fetch all groups
  const groups =
    unwrap<{ id: string; name: string; description: string | null; color: string }[]>(
      'select stakeholder_groups',
      await supabaseAdmin
        .from('stakeholder_groups')
        .select('id, name, description, color')
        .eq('user_id', user.id)
    ) ?? []

  // Per-project score tables are scoped to this user's projects. Without the
  // `in(project_id)` filter these reads returned every tenant's rows.
  const projectIds = projects.map((p) => p.id)

  const projectStakeholders = projectIds.length
    ? unwrap<Record<string, any>[]>(
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
        project_notes,
        created_at
      `)
          .in('project_id', projectIds)
      ) ?? []
    : []

  const projectGroups = projectIds.length
    ? unwrap<Record<string, any>[]>(
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
        reinforcement
      `)
          .in('project_id', projectIds)
      ) ?? []
    : []

  // Build cross-project insights
  const stakeholderHistory: Record<string, any[]> = {}
  const groupHistory: Record<string, any[]> = {}

  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const groupMap = new Map(groups.map((g) => [g.id, g]))

  // Map stakeholder performance across projects
  projectStakeholders.forEach((ps) => {
    if (!stakeholderHistory[ps.stakeholder_id]) {
      stakeholderHistory[ps.stakeholder_id] = []
    }
    const project = projectMap.get(ps.project_id)
    if (project) {
      stakeholderHistory[ps.stakeholder_id].push({
        projectId: ps.project_id,
        projectName: project.name,
        projectStatus: project.status,
        stakeholderType: ps.stakeholder_type,
        adkarScores: {
          awareness: ps.awareness,
          desire: ps.desire,
          knowledge: ps.knowledge,
          ability: ps.ability,
          reinforcement: ps.reinforcement,
        },
        engagementScore: ps.engagement_score,
        notes: ps.project_notes,
      })
    }
  })

  // Map group performance across projects
  projectGroups.forEach((pg) => {
    if (!groupHistory[pg.group_id]) {
      groupHistory[pg.group_id] = []
    }
    const project = projectMap.get(pg.project_id)
    const group = groupMap.get(pg.group_id)
    if (project && group) {
      groupHistory[pg.group_id].push({
        projectId: pg.project_id,
        projectName: project.name,
        projectStatus: project.status,
        sentiment: pg.group_sentiment,
        influenceLevel: pg.influence_level,
        adkarScores: {
          awareness: pg.awareness,
          desire: pg.desire,
          knowledge: pg.knowledge,
          ability: pg.ability,
          reinforcement: pg.reinforcement,
        },
      })
    }
  })

  // Format global stakeholders with group info
  const formattedStakeholders = globalStakeholders.map((gs) => {
    const groupData = Array.isArray(gs.stakeholder_groups)
      ? gs.stakeholder_groups[0]
      : gs.stakeholder_groups

    return {
      id: gs.id,
      name: gs.name,
      email: gs.email,
      role: gs.role,
      title: gs.title,
      department: gs.department,
      notes: gs.notes,
      org_level: gs.org_level || null,
      reports_to_id: gs.reports_to_id || null,
      is_me: gs.is_me || false,
      group: groupData
        ? {
            id: groupData.id,
            name: groupData.name,
            color: groupData.color,
          }
        : null,
      projectHistory: stakeholderHistory[gs.id] || [],
    }
  })

  // Resolve reports_to names
  const stakeholderNameMap = new Map(
    formattedStakeholders.map((s) => [s.id, s.name])
  )
  formattedStakeholders.forEach((s) => {
    ;(s as any).reports_to_name = s.reports_to_id
      ? stakeholderNameMap.get(s.reports_to_id) || null
      : null
  })

  // Format groups with history
  const formattedGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    color: g.color,
    memberCount: formattedStakeholders.filter((s) => s.group?.id === g.id).length,
    projectHistory: groupHistory[g.id] || [],
  }))

  // Build summary insights
  const meProfile = formattedStakeholders.find((s) => s.is_me) || null
  const insights = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalStakeholders: formattedStakeholders.length,
    totalGroups: formattedGroups.length,
    // Find patterns
    resistantPatterns: findResistancePatterns(formattedStakeholders, formattedGroups),
    championPatterns: findChampionPatterns(formattedStakeholders),
    orgHierarchyPatterns: findOrgHierarchyPatterns(formattedStakeholders),
    meProfile,
  }

  return NextResponse.json({
    projects,
    stakeholders: formattedStakeholders,
    groups: formattedGroups,
    insights,
  })
})

// Helper: Find stakeholders/groups that are frequently resistant
function findResistancePatterns(stakeholders: any[], groups: any[]) {
  const patterns: string[] = []

  // Check stakeholders
  stakeholders.forEach((s) => {
    const resistantProjects = s.projectHistory.filter(
      (h: any) => h.stakeholderType === 'resistant' || h.stakeholderType === 'skeptic'
    )
    if (resistantProjects.length >= 2) {
      patterns.push(
        `${s.name} has been resistant/skeptical in ${resistantProjects.length} projects: ${resistantProjects.map((p: any) => p.projectName).join(', ')}`
      )
    }
  })

  // Check groups
  groups.forEach((g) => {
    const lowEngagement = g.projectHistory.filter(
      (h: any) =>
        h.sentiment === 'negative' ||
        (h.adkarScores?.awareness < 40 && h.adkarScores?.desire < 40)
    )
    if (lowEngagement.length >= 2) {
      patterns.push(
        `${g.name} group has shown resistance in ${lowEngagement.length} projects`
      )
    }
  })

  return patterns
}

// Helper: Find org hierarchy patterns for AI context
function findOrgHierarchyPatterns(stakeholders: any[]) {
  const patterns: string[] = []
  const meProfile = stakeholders.find((s) => s.is_me)

  if (meProfile) {
    const sameDept = stakeholders.filter(
      (s) => !s.is_me && s.department && s.department === meProfile.department
    )
    if (sameDept.length > 0) {
      patterns.push(
        `${sameDept.length} stakeholder(s) in your department (${meProfile.department})`
      )
    }

    const directReports = stakeholders.filter(
      (s) => s.reports_to_id === meProfile.id
    )
    if (directReports.length > 0) {
      patterns.push(
        `Your direct reports: ${directReports.map((s: any) => s.name).join(', ')}`
      )
    }

    if (meProfile.reports_to_name) {
      patterns.push(`Your manager: ${meProfile.reports_to_name}`)
    }
  }

  return patterns
}

// Helper: Find stakeholders who are frequently champions
function findChampionPatterns(stakeholders: any[]) {
  const patterns: string[] = []

  stakeholders.forEach((s) => {
    const championProjects = s.projectHistory.filter(
      (h: any) =>
        h.stakeholderType === 'champion' || h.stakeholderType === 'early_adopter'
    )
    if (championProjects.length >= 2) {
      patterns.push(
        `${s.name} has been a champion/early adopter in ${championProjects.length} projects - consider leveraging them`
      )
    }
  })

  return patterns
}
