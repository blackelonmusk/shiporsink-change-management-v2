export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'onHold' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Stakeholder {
  id: string
  project_id: string
  name: string
  role: string
  engagement_score: number
  performance_score: number
  comments: string
  created_at: string
}

export interface ProjectAnalytics {
  riskAssessment: number
  engagementLevel: number
  trajectoryTrend: number[]
}
