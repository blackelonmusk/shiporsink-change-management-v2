'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus, Ship } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import type { Project, Stakeholder, ProjectAnalytics } from '@/lib/types'

interface ScoreHistory {
  id: string
  stakeholder_id: string
  engagement_score: number
  performance_score: number
  recorded_at: string
}

const STAKEHOLDER_TYPES = [
  { value: 'champion', label: 'Champion', color: '#22c55e' },
  { value: 'early_adopter', label: 'Early Adopter', color: '#3b82f6' },
  { value: 'neutral', label: 'Neutral', color: '#6b7280' },
  { value: 'skeptic', label: 'Skeptic', color: '#eab308' },
  { value: 'resistant', label: 'Resistant', color: '#ef4444' },
]

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

  const getTypeInfo = (type: string) => {
    return STAKEHOLDER_TYPES.find(t => t.value === type) || { value: '', label: 'Not Set', color: '#6b7280' }
  }

  const getTypeDistribution = () => {
    const distribution: {[key: string]: number} = {}
    stakeholders.forEach(s => {
      const type = (s as any).stakeholder_type || 'not_set'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return Object.entries(distribution).map(([type, count]) => ({
      name: type === 'not_set' ? 'Not Set' : getTypeInfo(type).label,
      value: count,
      color: type === 'not_set' ? '#6b7280' : getTypeInfo(type).color,
    }))
  }

  const getADKARData = () => {
    const stages = ['Awareness', 'Desire', 'Knowledge', 'Ability', 'Reinforcement']
    const counts = { Awareness: 0, Desire: 0, Knowledge: 0, Ability: 0, Reinforcement: 0 }
    
    stakeholders.forEach(s => {
      const stage = getADKARStage(s.engagement_score).stage
      counts[stage as keyof typeof counts]++
    })
    
    return stages.map(stage => ({
      stage,
      count: counts[stage as keyof typeof counts],
      fullMark: stakeholders.length || 1,
    }))
  }

  const stakeholderChartData = stakeholders.map(s => ({
    name: s.name.split(' ')[0],
    engagement: s.engagement_score,
    performance: s.performance_score,
  }))

  const typeDistribution = getTypeDistribution()
  const adkarData = getADKARData()
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

      {/* Cover Page */}
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white print:h-auto print:py-24">
        <div className="text-center">
          {(project as any).logo_url ? (
            <div className="mb-8">
              <img 
                src={(project as any).logo_url} 
                alt="Company Logo" 
                className="h-24 max-w-64 object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mb-8">
              <Ship className="w-12 h-12 text-white" />
            </div>
          )}
          {!(project as any).logo_url && (
            <p className="text-blue-300 text-lg mb-4 tracking-widest uppercase">Ship or Sink</p>
          )}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Change Readiness<br />Report
          </h1>
          <div className="w-24 h-1 bg-blue-400 mx-auto mb-8"></div>
          <h2 className="text-3xl text-blue-200 mb-4">{project.name}</h2>
          <p className="text-blue-300">{reportDate}</p>
        </div>
        
        <div className="absolute bottom-12 text-center print:relative print:mt-12">
          <p className="text-blue-400 text-sm">Prepared by Ship or Sink Change Management</p>
          <p className="text-blue-500 text-sm">shiporsink.ai</p>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 text-gray-900">
        {/* Executive Summary */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
            Executive Summary
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
              <p className="text-blue-600 text-sm font-medium mb-2">Change Readiness</p>
              <p className={`text-5xl font-bold ${
                readinessScore >= 60 ? 'text-green-600' :
                readinessScore >= 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>{readinessScore}%</p>
              <p className="text-gray-500 text-xs mt-2">Overall Score</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200">
              <p className="text-purple-600 text-sm font-medium mb-2">Risk Level</p>
              <p className={`text-5xl font-bold ${
                (analytics?.riskAssessment || 0) >= 75 ? 'text-red-600' :
                (analytics?.riskAssessment || 0) >= 50 ? 'text-yellow-600' :
                'text-green-600'
              }`}>{analytics?.riskAssessment || 0}%</p>
              <p className="text-gray-500 text-xs mt-2">Based on Engagement</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
              <p className="text-green-600 text-sm font-medium mb-2">Stakeholders</p>
              <p className="text-5xl font-bold text-green-600">{stakeholders.length}</p>
              <p className="text-gray-500 text-xs mt-2">Being Tracked</p>
            </div>
          </div>
        </section>

        {/* ADKAR Analysis with Radar Chart */}
        {stakeholders.length > 0 && (
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
              ADKAR Stage Analysis
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="h-64 flex items-center justify-center">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" width={280} height={250} data={adkarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="stage" tick={{ fill: '#374151', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, stakeholders.length || 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Radar name="Stakeholders" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  </RadarChart>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-4">Stage Breakdown</h4>
                <div className="space-y-3">
                  {adkarData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-600">{item.stage}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(item.count / (stakeholders.length || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-900 w-6 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  ADKAR: Awareness → Desire → Knowledge → Ability → Reinforcement
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Stakeholder Type Distribution */}
        {stakeholders.length > 0 && (
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
              Stakeholder Type Distribution
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="h-48 flex items-center justify-center">
                  <PieChart width={180} height={180}>
                    <Pie
                      data={typeDistribution}
                      cx={90}
                      cy={90}
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="space-y-3">
                  {typeDistribution.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-green-600">{typeDistribution.find(t => t.name === 'Champion')?.value || 0}</span> Champions | 
                    <span className="font-semibold text-red-600 ml-1">{typeDistribution.find(t => t.name === 'Resistant')?.value || 0}</span> Resistant
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stakeholder Overview Chart */}
        {stakeholders.length > 0 && (
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
              Stakeholder Engagement Overview
            </h3>
            <div className="h-64 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stakeholderChartData}>
                  <XAxis dataKey="name" stroke="#374151" />
                  <YAxis domain={[0, 100]} stroke="#374151" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="engagement" fill="#3b82f6" name="Engagement" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="performance" fill="#22c55e" name="Performance" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex gap-6 justify-center text-sm">
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

        {/* Stakeholder Details Table */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
            Stakeholder Analysis
          </h3>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">Role</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">Type</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">Engagement</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">ADKAR</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {stakeholders.map((s, i) => {
                  const adkar = getADKARStage(s.engagement_score)
                  const trend = getTrend(s.id)
                  const typeInfo = getTypeInfo((s as any).stakeholder_type)
                  return (
                    <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 font-medium">{s.name}</td>
                      <td className="py-3 px-4 text-gray-600">{s.role}</td>
                      <td className="py-3 px-4 text-center">
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: typeInfo.color }}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${
                          s.engagement_score >= 60 ? 'text-green-600' :
                          s.engagement_score >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{s.engagement_score}%</span>
                      </td>
                      <td className={`py-3 px-4 text-center font-medium ${adkar.color}`}>
                        {adkar.stage}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />}
                        {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />}
                        {trend === 'neutral' && <Minus className="w-5 h-5 text-gray-400 mx-auto" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recommendations */}
        <section className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-4">
            Key Recommendations
          </h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 space-y-4">
            {stakeholders.filter(s => (s as any).stakeholder_type === 'resistant').length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="text-gray-700"><strong className="text-red-700">Critical:</strong> {stakeholders.filter(s => (s as any).stakeholder_type === 'resistant').length} resistant stakeholder(s) identified. Prioritize direct conversations to understand their concerns and address root causes.</p>
              </div>
            )}
            {stakeholders.filter(s => s.engagement_score < 40).length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">!</span>
                <p className="text-gray-700"><strong className="text-red-700">Critical:</strong> {stakeholders.filter(s => s.engagement_score < 40).length} stakeholder(s) have engagement below 40%. These individuals need immediate attention.</p>
              </div>
            )}
            {readinessScore < 50 && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">⚠</span>
                <p className="text-gray-700"><strong className="text-yellow-700">Warning:</strong> Overall change readiness is low ({readinessScore}%). Consider slowing the pace of change until stakeholder buy-in improves.</p>
              </div>
            )}
            {stakeholders.some(s => getADKARStage(s.engagement_score).stage === 'Awareness') && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">i</span>
                <p className="text-gray-700"><strong className="text-blue-700">Focus Area:</strong> Some stakeholders are still at the Awareness stage. Increase communication about why this change is necessary.</p>
              </div>
            )}
            {stakeholders.filter(s => (s as any).stakeholder_type === 'champion').length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <p className="text-gray-700"><strong className="text-green-700">Leverage:</strong> You have {stakeholders.filter(s => (s as any).stakeholder_type === 'champion').length} Champion(s). Engage them to help influence resistant stakeholders and spread positive messaging.</p>
              </div>
            )}
            {readinessScore >= 60 && (
              <div className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <p className="text-gray-700"><strong className="text-green-700">Positive:</strong> Change readiness is trending well. Continue current engagement strategies and prepare for the Knowledge and Ability stages.</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Ship className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-700">Ship or Sink</span>
          </div>
          <p>Change Management Assistant</p>
          <p className="text-blue-600">shiporsink.ai</p>
        </footer>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:h-auto { height: auto !important; }
          .print\\:py-24 { padding-top: 6rem !important; padding-bottom: 6rem !important; }
          .print\\:relative { position: relative !important; }
          .print\\:mt-12 { margin-top: 3rem !important; }
        }
      `}</style>
    </div>
  )
}
