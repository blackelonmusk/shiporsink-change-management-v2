'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { Project, Stakeholder, ProjectAnalytics } from '@/lib/types'

interface ScoreHistory {
  id: string
  stakeholder_id: string
  engagement_score: number
  performance_score: number
  recorded_at: string
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [allHistory, setAllHistory] = useState<{[key: string]: ScoreHistory[]}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [projectId])

  const fetchAllData = async () => {
    setLoading(true)
    
    const [projectRes, stakeholdersRes, analyticsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/stakeholders?projectId=${projectId}`),
      fetch(`/api/analytics?projectId=${projectId}`),
    ])

    let projectData = null
    let stakeholdersData: Stakeholder[] = []
    
    if (projectRes.ok) {
      projectData = await projectRes.json()
      setProject(projectData)
    }
    if (stakeholdersRes.ok) {
      stakeholdersData = await stakeholdersRes.json()
      setStakeholders(stakeholdersData)
    }
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json())

    // Fetch history for all stakeholders
    const historyPromises = stakeholdersData.map(s => 
      fetch(`/api/history?stakeholderId=${s.id}`).then(r => r.json())
    )
    const histories = await Promise.all(historyPromises)
    
    const historyMap: {[key: string]: ScoreHistory[]} = {}
    stakeholdersData.forEach((s, i) => {
      historyMap[s.id] = histories[i]
    })
    setAllHistory(historyMap)
    
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getChangeReadinessScore = () => {
    if (stakeholders.length === 0) return 0
    const avgEngagement = stakeholders.reduce((sum, s) => sum + s.engagement_score, 0) / stakeholders.length
    const avgPerformance = stakeholders.reduce((sum, s) => sum + s.performance_score, 0) / stakeholders.length
    return Math.round((avgEngagement + avgPerformance) / 2)
  }

  const getADKARStage = (score: number) => {
    if (score < 20) return { stage: 'Awareness', color: 'text-red-400' }
    if (score < 40) return { stage: 'Desire', color: 'text-orange-400' }
    if (score < 60) return { stage: 'Knowledge', color: 'text-yellow-400' }
    if (score < 80) return { stage: 'Ability', color: 'text-blue-400' }
    return { stage: 'Reinforcement', color: 'text-green-400' }
  }

  const getTrend = (stakeholderId: string) => {
    const history = allHistory[stakeholderId] || []
    if (history.length < 2) return 'neutral'
    const latest = history[history.length - 1].engagement_score
    const previous = history[history.length - 2].engagement_score
    if (latest > previous) return 'up'
    if (latest < previous) return 'down'
    return 'neutral'
  }

  const stakeholderChartData = stakeholders.map(s => ({
    name: s.name.split(' ')[0],
    engagement: s.engagement_score,
    performance: s.performance_score,
  }))

  const readinessScore = getChangeReadinessScore()
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  if (loading) return <div className="p-8 text-white">Loading report...</div>
  if (!project) return <div className="p-8 text-white">Project not found</div>

  return (
    <div className="min-h-screen bg-white">
      {/* Print-hidden controls */}
      <div className="print:hidden bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(`/project/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Project
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 text-gray-900">
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">⛵</span>
            </div>
            <span className="text-blue-600 font-semibold">Ship or Sink</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Change Readiness Report
          </h1>
          <h2 className="text-2xl text-gray-600">{project.name}</h2>
          <p className="text-gray-500 mt-2">Generated on {reportDate}</p>
        </div>

        {/* Executive Summary */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
            Executive Summary
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Change Readiness Score</p>
              <p className={`text-5xl font-bold ${
                readinessScore >= 60 ? 'text-green-600' :
                readinessScore >= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>{readinessScore}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Risk Level</p>
              <p className={`text-5xl font-bold ${
                (analytics?.riskAssessment || 0) >= 75 ? 'text-red-600' :
                (analytics?.riskAssessment || 0) >= 50 ? 'text-yellow-600' :
                'text-green-600'
              }`}>{analytics?.riskAssessment || 0}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Stakeholders Tracked</p>
              <p className="text-5xl font-bold text-blue-600">{stakeholders.length}</p>
            </div>
          </div>
        </section>

        {/* Stakeholder Overview Chart */}
        {stakeholders.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
              Stakeholder Engagement Overview
            </h3>
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stakeholderChartData}>
                  <XAxis dataKey="name" stroke="#374151" />
                  <YAxis domain={[0, 100]} stroke="#374151" />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="#3b82f6" name="Engagement" />
                  <Bar dataKey="performance" fill="#22c55e" name="Performance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Performance</span>
              </div>
            </div>
          </section>
        )}

        {/* Stakeholder Details */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
            Stakeholder Analysis
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-gray-600 font-semibold">Name</th>
                <th className="text-left py-3 text-gray-600 font-semibold">Role</th>
                <th className="text-center py-3 text-gray-600 font-semibold">Engagement</th>
                <th className="text-center py-3 text-gray-600 font-semibold">Performance</th>
                <th className="text-center py-3 text-gray-600 font-semibold">ADKAR Stage</th>
                <th className="text-center py-3 text-gray-600 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {stakeholders.map(s => {
                const adkar = getADKARStage(s.engagement_score)
                const trend = getTrend(s.id)
                return (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-gray-600">{s.role}</td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${
                        s.engagement_score >= 60 ? 'text-green-600' :
                        s.engagement_score >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{s.engagement_score}%</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${
                        s.performance_score >= 60 ? 'text-green-600' :
                        s.performance_score >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{s.performance_score}%</span>
                    </td>
                    <td className={`py-3 text-center font-medium ${adkar.color}`}>
                      {adkar.stage}
                    </td>
                    <td className="py-3 text-center">
                      {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />}
                      {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />}
                      {trend === 'neutral' && <Minus className="w-5 h-5 text-gray-400 mx-auto" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* Recommendations */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
            Key Recommendations
          </h3>
          <div className="bg-blue-50 rounded-lg p-6 space-y-3">
            {stakeholders.filter(s => s.engagement_score < 40).length > 0 && (
              <div className="flex gap-3">
                <span className="text-red-600 font-bold">!</span>
                <p><strong>Critical:</strong> {stakeholders.filter(s => s.engagement_score < 40).length} stakeholder(s) have engagement below 40%. Prioritize direct conversations to understand their resistance.</p>
              </div>
            )}
            {readinessScore < 50 && (
              <div className="flex gap-3">
                <span className="text-yellow-600 font-bold">⚠</span>
                <p><strong>Warning:</strong> Overall change readiness is low ({readinessScore}%). Consider slowing the pace of change until stakeholder buy-in improves.</p>
              </div>
            )}
            {stakeholders.some(s => getADKARStage(s.engagement_score).stage === 'Awareness') && (
              <div className="flex gap-3">
                <span className="text-blue-600 font-bold">ℹ</span>
                <p><strong>Focus Area:</strong> Some stakeholders are still at the Awareness stage. Increase communication about why this change is necessary.</p>
              </div>
            )}
            {readinessScore >= 60 && (
              <div className="flex gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p><strong>Positive:</strong> Change readiness is trending well. Continue current engagement strategies and prepare for the Knowledge and Ability stages.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
          <p>Generated by Ship or Sink Change Management Assistant</p>
          <p>shiporsink.ai</p>
        </footer>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
