'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Ship, Plus } from 'lucide-react'
import type { Project } from '@/lib/types'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsCreating(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProjectName,
        description: '',
      }),
    })

    setNewProjectName('')
    setIsCreating(false)
    fetchProjects()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Ship or Sink</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Your Projects</h2>
          
          <form onSubmit={createProject} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name..."
              className="flex-1 px-4 py-2 border rounded-lg"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create
            </button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {project.description || 'No description'}
              </p>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {project.status}
              </span>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No projects yet. Create your first one above!
          </div>
        )}
      </main>
    </div>
  )
}
