import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireProjectAccess } from '@/lib/auth'
import { withAuth, badRequest, unwrap } from '@/lib/api-utils'

export const GET = withAuth('GET /api/analytics', async ({ request, user }) => {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) throw badRequest('projectId required')

  await requireProjectAccess(user.id, projectId)

  const stakeholders = unwrap<
    { name: string; engagement_score: number | null; performance_score: number | null }[]
  >(
    'select stakeholders for analytics',
    await supabaseAdmin
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
  )

  if (!stakeholders || stakeholders.length === 0) {
    return NextResponse.json({
      engagementLevel: 0,
      riskAssessment: 0,
      stakeholderBreakdown: [],
    })
  }

  const avgEngagement = Math.round(
    stakeholders.reduce((sum, s) => sum + (s.engagement_score ?? 0), 0) /
      stakeholders.length
  )

  const riskAssessment = Math.round(100 - avgEngagement)

  const stakeholderBreakdown = stakeholders.map((s) => ({
    name: s.name,
    engagement: s.engagement_score,
    performance: s.performance_score,
  }))

  return NextResponse.json({
    engagementLevel: avgEngagement,
    riskAssessment,
    stakeholderBreakdown,
  })
})
