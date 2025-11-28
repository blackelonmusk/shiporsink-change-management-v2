'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Pencil, Trash2, X, Users } from 'lucide-react'
import Header from '@/components/Header'
import PageTransition from '@/components/PageTransition'
import type { Project } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

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
  }

  const saveProject = async () => {
    if (!editingProject || !editName.trim() || !user) return

    await fetch(`/api/projects/${editingProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName,
        description: editDescription 
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

          <form onSubmit={createProject} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name..."
              className="flex-1 px-4 py-2 rounded-lg"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create
            </button>
          </form>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
              key={project.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="text-xl font-semibold text-white cursor-pointer hover:text-blue-400"
                >
                  {project.name}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(project)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteProject(project)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {project.description && (
                <p className="text-gray-400 text-sm mb-3">{project.description}</p>
              )}
              <p className="text-gray-500 text-sm">
                Status: {project.status || 'active'}
              </p>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No projects yet. Create your first one above!
          </p>
        )}

        {/* Shared Projects Section */}
        {sharedProjects.length > 0 && (
          <>
            <h2 className="text-3xl font-bold text-white mb-6 mt-12 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              Shared With You
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-lg p-6 border border-purple-700 hover:border-purple-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      onClick={() => router.push(`/project/${project.id}`)}
                      className="text-xl font-semibold text-white cursor-pointer hover:text-purple-400"
                    >
                      {project.name}
                    </h3>
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                      Shared
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-gray-400 text-sm mb-3">{project.description}</p>
                  )}
                  <p className="text-gray-500 text-sm">
                    Status: {project.status || 'active'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        </main>
      </PageTransition>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Project</h2>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveProject}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
