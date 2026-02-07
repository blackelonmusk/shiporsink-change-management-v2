'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Pencil, Trash2, X, Users, Sparkles, CheckCircle2, Clock, Pause, XCircle } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import CreateFromTemplateModal from '@/components/CreateFromTemplateModal'
import { SuiteApps } from '@/components/SuiteApps'
import type { Project } from '@/lib/types'
import { authFetch } from '@/lib/api'
import type { User } from '@supabase/supabase-js'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: Clock, color: 'bg-emerald-500', textColor: 'text-emerald-400', bgMuted: 'bg-emerald-500/10' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-blue-500', textColor: 'text-blue-400', bgMuted: 'bg-blue-500/10' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-yellow-500', textColor: 'text-yellow-400', bgMuted: 'bg-yellow-500/10' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-400', bgMuted: 'bg-red-500/10' },
]

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [sharedProjects, setSharedProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('active')
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
    setLoading(false)
    fetchProjects()
  }

  const fetchProjects = async () => {
    // Fetch owned projects
    const ownedRes = await authFetch(`/api/projects`)
    if (ownedRes.ok) {
      const data = await ownedRes.json()
      setProjects(data)
    }

    // Fetch shared projects
    const sharedRes = await authFetch(`/api/projects/shared`)
    if (sharedRes.ok) {
      const data = await sharedRes.json()
      setSharedProjects(data)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim() || !user) return

    await authFetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProjectName
      }),
    })

    setNewProjectName('')
    fetchProjects()
  }

  const startEditing = (project: Project) => {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditStatus(project.status || 'active')
  }

  const saveProject = async () => {
    if (!editingProject || !editName.trim() || !user) return

    await authFetch(`/api/projects/${editingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        status: editStatus
      }),
    })

    setEditingProject(null)
    fetchProjects()
  }

  const deleteProject = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This will delete all stakeholders and cannot be undone.`)) return
    if (!user) return

    await authFetch(`/api/projects/${project.id}`, {
      method: 'DELETE',
    })

    fetchProjects()
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
    const Icon = statusInfo.icon
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${statusInfo.textColor} ${statusInfo.bgMuted}`}>
        <Icon className="w-3.5 h-3.5" />
        {statusInfo.label}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />
        
        <PageTransition className="flex-1">
          <main className="flex-1 px-4 md:px-8 py-8 pb-20 md:pb-8 overflow-x-hidden w-full">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">Your Projects</h2>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {/* Create Blank Project */}
                <form onSubmit={createProject} className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="New project name..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center gap-2 whitespace-nowrap transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Create
                  </button>
                </form>

                {/* Create from Template */}
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-zinc-800 border border-zinc-700 text-white px-6 py-2.5 rounded-lg hover:bg-zinc-700 hover:border-orange-500/50 flex items-center gap-2 justify-center whitespace-nowrap transition-all hover:scale-105 font-medium group"
                >
                  <Sparkles className="w-5 h-5 text-orange-400 group-hover:text-orange-300" />
                  Create from Template
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-orange-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 cursor-pointer group animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => router.push(`/project/${project.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors flex-1 pr-2">
                        {project.name}
                      </h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(project)
                          }}
                          className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProject(project)
                          }}
                          className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(project.status || 'active')}
                    </div>
                  </div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-16 animate-fadeIn">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-zinc-400 text-lg mb-2">
                    No projects yet
                  </p>
                  <p className="text-zinc-600 text-sm">
                    Create your first project above to get started!
                  </p>
                </div>
              )}

              {/* Shared Projects Section */}
              {sharedProjects.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6 mt-12 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    Shared With You
                  </h2>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sharedProjects.map((project, index) => (
                      <div
                        key={project.id}
                        className="bg-zinc-900 rounded-xl p-5 border border-purple-500/30 hover:border-purple-500/60 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer group animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors flex-1 pr-2">
                            {project.name}
                          </h3>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md font-medium border border-purple-500/30">
                            Shared
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          {getStatusBadge(project.status || 'active')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Suite Apps - Cross-App Navigation */}
              <div className="mt-16 max-w-4xl mx-auto">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <SuiteApps currentApp="change" />
                </div>
              </div>
            </div>
          </main>
        </PageTransition>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 border border-zinc-800 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button 
                onClick={() => setEditingProject(null)} 
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2 font-medium">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2 font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-2 font-medium">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((status) => {
                    const Icon = status.icon
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setEditStatus(status.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all font-medium
                          ${editStatus === status.value
                            ? `${status.color} border-transparent text-white shadow-lg`
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{status.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveProject}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="flex-1 bg-zinc-800 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create from Template Modal */}
      <CreateFromTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
      />
    </div>
  )
}
