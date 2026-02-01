'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'
import TemplateGallery from './TemplateGallery'

interface CreateFromTemplateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateFromTemplateModal({ isOpen, onClose }: CreateFromTemplateModalProps) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleSelectTemplate = (templateCategory: string) => {
    setSelectedTemplate(templateCategory)
  }

  const handleCreate = async () => {
    if (!selectedTemplate || !projectName) {
      toast.error('Please select a template and enter a project name')
      return
    }

    setIsCreating(true)

    try {
      const response = await authFetch('/api/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCategory: selectedTemplate,
          projectName,
          startDate: startDate || new Date().toISOString().split('T')[0]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const data = await response.json()
      
      toast.success('Project created from template!')
      
      // Redirect to the new project
      router.push(`/project/${data.project.id}`)
      
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project from template')
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    if (selectedTemplate) {
      setSelectedTemplate(null)
      setProjectName('')
      setStartDate('')
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">
            {selectedTemplate ? 'Project Details' : 'Choose a Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedTemplate ? (
            // Step 1: Template Selection
            <TemplateGallery onSelectTemplate={handleSelectTemplate} />
          ) : (
            // Step 2: Project Details
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <p className="text-gray-400">
                  Great choice! Now let's set up your project with pre-built stakeholders and milestones.
                </p>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., New CRM System Rollout"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                  autoFocus
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Milestones will be automatically scheduled based on this date
                </p>
              </div>

              {/* What Gets Created */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-3">What's included:</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Pre-defined stakeholders with roles and types
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Milestone timeline with smart date scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Best practice guidance and tips
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">→</span>
                    Fully customizable after creation
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBack}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !projectName}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Project...
                    </>
                  ) : (
                    <>
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
