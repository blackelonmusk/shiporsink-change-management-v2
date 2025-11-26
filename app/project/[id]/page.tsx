'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles, Save, TrendingUp, X, FileText, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AIChat from '@/components/AIChat'
import type { Project, Stakeholder, ProjectAnalytics } from '@/lib/types'

interface ScoreHistory {
  id: string
  stakeholder_id: string
  engagement_score: number
  performance_score: number
  recorded_at: string
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [newStakeholderName, setNewStakeholderName] = useState('')
  const [newStakeholderRole, setNewStakeholderRole] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [editingScores, setEditingScores] = useState<{[key: string]: {engagement: number, performance: number}}>({})
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null)
  const [historyData, setHistoryData] = useState<ScoreHistory[]>([])
  const [showTrends, setShowTrends] = useState(false)

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    const [projectRes, stakeholdersRes, analyticsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/stakeholders?projectId=${projectId}`),
      fetch(`/api/analytics?projectId=${projectId}`),
    ])

    if (projectRes.ok) setProject(await projectRes.json())
    if (stakeholdersRes.ok) {
      const data = await stakeholdersRes.json()
      setStakeholders(data)
      const scores: {[key: string]: {engagement: number, performance: number}} = {}
      data.forEach((s: Stakeholder) => {
        scores[s.id] = { engagement: s.engagement_score, performance: s.performance_score }
      })
      setEditingScores(scores)
    }
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
  }

  const fetchHistory = async (stakeholder: Stakeholder) => {
    const res = await fetch(`/api/history?stakeholderId=${stakeholder.id}`)
    if (res.ok) {
      const data = await res.json()
      setHistoryData(data)
      setSelectedStakeholder(stakeholder)
      setShowTrends(true)
    }
  }

  const addStakeholder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStakeholderName.trim() || !newStakeholderRole.trim()) return

    await fetch('/api/stakeholders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        name: newStakeholderName,
        role: newStakeholderRole,
      }),
    })

    setNewStakeholderName('')
    setNewStakeholderRole('')
    fetchData()
  }

  const updateScores = async (stakeholderId: string) => {
    const scores = editingScores[stakeholderId]
    if (!scores) return

    await fetch('/api/stakeholders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: stakeholderId,
        engagement_score: scores.engagement,
        performance_score: scores.performance,
        comments: '',
      }),
    })

    fetchData()
  }

  const deleteStakeholder = async (stakeholderId: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return

    await fetch(`/api/stakeholders?id=${stakeholderId}`, {
      method: 'DELETE',
    })

    fetchData()
  }

  const handleScoreChange = (stakeholderId: string, type: 'engagement' | 'performance', value: number) => {
    setEditingScores(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        [type]: value
      }
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const chartData = historyData.map(h => ({
    date: formatDate(h.recorded_at),
    engagement: h.engagement_score,
    performance: h.performance_score,
  }))

  const projectContext = {
    projectName: project?.name || '',
    status: project?.status || '',
    riskLevel: analytics?.riskAssessment || 0,
    totalEngagement: analytics?.engagementLevel || 0,
    stakeholders: stakeholders.map(s => ({
      name: s.name,
      role: s.role,
      engagement: editingScores[s.id]?.engagement || s.engagement_score,
      performance: editingScores[s.id]?.performance || s.performance_score,
      comments: s.comments,
    })),
  }

  if (!project) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <button
              onClick={() => router.push(`/project/${projectId}/report`)}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              <FileText className="w-5 h-5" />
              Generate Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Stakeholders</h3>
            <p className="text-3xl font-bold text-white">{stakeholders.length}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Engagement</h3>
            <p className="text-3xl font-bold text-white">{analytics?.engagementLevel || 0}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Risk Level</h3>
            <p className={`text-3xl font-bold ${
              (analytics?.riskAssessment || 0) >= 75 ? 'text-red-500' :
              (analytics?.riskAssessment || 0) >= 50 ? 'text-yellow-500' :
              'text-green-500'
            }`}>{analytics?.riskAssessment || 0}%</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Stakeholders</h2>
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Sparkles className="w-5 h-5" />
              Ask AI Coach
            </button>
          </div>

          <form onSubmit={addStakeholder} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newStakeholderName}
              onChange={(e) => setNewStakeholderName(e.target.value)}
              placeholder="Name..."
              className="flex-1 px-4 py-2 rounded-lg"
            />
            <input
              type="text"
              value={newStakeholderRole}
              onChange={(e) => setNewStakeholderRole(e.target.value)}
              placeholder="Role..."
              className="flex-1 px-4 py-2 rounded-lg"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </form>

          <div className="space-y-4">
            {stakeholders.map((s) => (
              <div key={s.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{s.name}</h3>
                    <p className="text-sm text-gray-400">{s.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchHistory(s)}
                      className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 flex items-center gap-1 text-sm"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Trends
                    </button>
                    <button
                      onClick={() => updateScores(s.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => deleteStakeholder(s.id, s.name)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Engagement</span>
                      <span className="text-white font-medium">{editingScores[s.id]?.engagement || 0}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingScores[s.id]?.engagement || 0}
                      onChange={(e) => handleScoreChange(s.id, 'engagement', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Performance</span>
                      <span className="text-white font-medium">{editingScores[s.id]?.performance || 0}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingScores[s.id]?.performance || 0}
                      onChange={(e) => handleScoreChange(s.id, 'performance', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stakeholders.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No stakeholders yet. Add your first one above!
            </p>
          )}
        </div>
      </main>

      {/* Trends Modal */}
      {showTrends && selectedStakeholder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedStakeholder.name}</h2>
                <p className="text-gray-400">{selectedStakeholder.role} - Score History</p>
              </div>
              <button onClick={() => setShowTrends(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {chartData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Engagement"
                      dot={{ fill: '#3b82f6' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Performance"
                      dot={{ fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Not enough data yet.</p>
                  <p className="text-sm">Update scores a few times to see trends.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-400">Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-400">Performance</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectContext={projectContext}
      />
    </div>
  )
}
