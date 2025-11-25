'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import type { Project, Stakeholder, ProjectAnalytics } from '@/lib/types'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [newStakeholderName, setNewStakeholderName] = useState('')
  const [newStakeholderRole, setNewStakeholderRole] = useState('')

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    const [projectRes, stakeholdersRes, analyticsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/stakeholders?projectId=${projectId}`),
      fetch(`/api/analytics?projectId=${projectId}`),
    ])

    setProject(await projectRes.json())
    setStakeholders(await stakeholdersRes.json())
    setAnalytics(await analyticsRes.json())
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

  const askAI = async () => {
    const response = await fetch('https://shiporsink-ai-api.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Give me a brief project status update and what I should focus on.',
        projectContext: {
          projectName: project?.name,
          status: project?.status,
          riskLevel: analytics?.riskAssessment,
          totalEngagement: analytics?.engagementLevel,
          stakeholders: stakeholders.map(s => ({
            name: s.name,
            role: s.role,
            engagement: s.engagement_score,
            performance: s.performance_score,
            comments: s.comments,
          })),
        },
      }),
    })

    const data = await response.json()
    alert(data.response) // Simple demo - would make this nicer in full version
  }

  if (!project) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Stakeholders</h3>
            <p className="text-3xl font-bold">{stakeholders.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Engagement</h3>
            <p className="text-3xl font-bold">{analytics?.engagementLevel || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Risk Level</h3>
            <p className="text-3xl font-bold text-yellow-600">{analytics?.riskAssessment || 0}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Stakeholders</h2>
            <button
              onClick={askAI}
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
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              value={newStakeholderRole}
              onChange={(e) => setNewStakeholderRole(e.target.value)}
              placeholder="Role..."
              className="flex-1 px-4 py-2 border rounded-lg"
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
              <div key={s.id} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-gray-600">{s.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Engagement: {s.engagement_score}/100</p>
                    <p className="text-sm">Performance: {s.performance_score}/100</p>
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
    </div>
  )
}
