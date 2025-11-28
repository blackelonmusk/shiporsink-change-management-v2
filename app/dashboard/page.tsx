'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Pencil, Trash2, X, Users, Sparkles, CheckCircle2, Clock, Pause, XCircle } from 'lucide-react'
import Header from '@/components/Header'
import PageTransition from '@/components/PageTransition'
import CreateFromTemplateModal from '@/components/CreateFromTemplateModal'
import type { Project } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: Clock, color: 'bg-green-500', textColor: 'text-green-400' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-blue-500', textColor: 'text-blue-400' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-400' },
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
    fetchProjects(user.id, user.email || '')
  }

  const fetchProjects = async (userId: string, email: string) => {
    // Fetch owned projects
    const ownedRes = await fetch(`/api/projects?userId=${userId}`)
    if (ownedRes.ok) {
      const data = await ownedRes.json()
      setProjects(data)
    }

    // Fetch shared projects
    const sharedRes = await fetch(`/api/projects/shared?email=${email}`)
    if (sharedRes.ok) {
      const data = await sharedRes.json()
      setSharedProjects(data)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim() || !user) return

    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newProjectName,
        user_id: user.id 
      }),
    })

    setNewProjectName('')
    fetchProjects(user.id, user.email || '')
  }

  const startEditing = (project: Project) => {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description || '')
    setEditStatus(project.status || 'active')
  }

  const saveProject = async () => {
    if (!editingProject || !editName.trim() || !user) return

    await fetch(`/api/projects/${editingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName,
        description: editDescription,
        status: editStatus
      }),
    })

    setEditingProject(null)
    fetchProjects(user.id, user.email || '')
  }

  const deleteProject = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"? This will delete all stakeholders and cannot be undone.`)) return
    if (!user) return

    await fetch(`/api/projects/${project.id}`, {
      method: 'DELETE',
    })

    fetchProjects(user.id, user.email || '')
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
    const Icon = statusInfo.icon
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium ${statusInfo.textColor}`}>
        <Icon className="w-3.5 h-3.5" />
        {statusInfo.label}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <PageTransition>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-white mb-6">Your Projects</h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {/* Create Blank Project */}
            <form onSubmit={createProject} className="flex gap-2 flex-1">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create
              </button>
            </form>

            {/* Create from Template */}
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 justify-center whitespace-nowrap transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Create from Template
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="text-xl font-semibold text-white hover:text-blue-400 transition-colors flex-1"
                  >
                    {project.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(project)
                      }}
                      className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteProject(project)
                      }}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {getStatusBadge(project.status || 'active')}
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg mb-2">
                No projects yet
              </p>
              <p className="text-gray-600 text-sm">
                Create your first project above to get started!
              </p>
            </div>
          )}

          {/* Shared Projects Section */}
          {sharedProjects.length > 0 && (
            <>
              <h2 className="text-3xl font-bold text-white mb-6 mt-12 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-400" />
                Shared With You
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedProjects.map((project, index) => (
                  <div
                    key={project.id}
                    className="bg-gray-800 rounded-lg p-6 border border-purple-700 hover:border-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="text-xl font-semibold text-white hover:text-purple-400 transition-colors flex-1"
                      >
                        {project.name}
                      </h3>
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded font-medium">
                        Shared
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {getStatusBadge(project.status || 'active')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </PageTransition>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((status) => {
                    const Icon = status.icon
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setEditStatus(status.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                          ${editStatus === status.value
                            ? `${status.color} border-transparent text-white`
                            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveProject}
                className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="flex-1 bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 font-medium transition-colors"
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
