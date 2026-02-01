import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, verifyProjectOwnership } from '@/lib/auth'

export async function GET(request: Request) {
  const { user, error: authError } = await getAuthenticatedUser(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const hasAccess = await verifyProjectOwnership(user.id, projectId)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: stakeholders, error } = await supabaseAdmin
    .from('stakeholders')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!stakeholders || stakeholders.length === 0) {
    return NextResponse.json({
      engagementLevel: 0,
      riskAssessment: 0,
      stakeholderBreakdown: []
    })
  }

  const avgEngagement = Math.round(
    stakeholders.reduce((sum, s) => sum + s.engagement_score, 0) / stakeholders.length
  )

  const riskAssessment = Math.round(100 - avgEngagement)

  const stakeholderBreakdown = stakeholders.map(s => ({
    name: s.name,
    engagement: s.engagement_score,
    performance: s.performance_score
  }))

  return NextResponse.json({
    engagementLevel: avgEngagement,
    riskAssessment,
    stakeholderBreakdown
  })
}
