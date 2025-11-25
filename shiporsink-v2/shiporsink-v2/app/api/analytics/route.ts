import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const { data: stakeholders, error } = await supabase
    .from('stakeholders')
    .select('engagement_score')
    .eq('project_id', projectId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalEngagement = stakeholders.reduce(
    (sum, s) => sum + s.engagement_score,
    0
  )

  // Calculate risk based on engagement
  let riskAssessment = 0
  if (totalEngagement < 50) riskAssessment = 100
  else if (totalEngagement < 100) riskAssessment = 75
  else if (totalEngagement < 150) riskAssessment = 50
  else riskAssessment = 25

  return NextResponse.json({
    riskAssessment,
    engagementLevel: totalEngagement,
    trajectoryTrend: [totalEngagement],
  })
}
