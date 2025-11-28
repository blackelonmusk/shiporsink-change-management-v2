'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, FileText } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
  guidance: string
}

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void
}

const templates: Template[] = [
  {
    id: 'system_implementation',
    name: 'System Implementation',
    description: 'For rolling out new software systems, platforms, or technology infrastructure. Perfect for CRM, ERP, or internal tool deployments.',
    category: 'system_implementation',
    icon: '🖥️',
    guidance: 'Focus on training and technical readiness. Identify power users early as champions. Plan for parallel running period.'
  },
  {
    id: 'process_change',
    name: 'Process Change',
    description: 'When updating workflows, procedures, or business processes. Ideal for operational improvements and efficiency initiatives.',
    category: 'process_change',
    icon: '🔄',
    guidance: 'Map current vs. future state clearly. Involve process owners early. Expect resistance from those comfortable with old ways.'
  },
  {
    id: 'org_restructure',
    name: 'Organizational Restructure',
    description: 'For team reorganizations, reporting line changes, or departmental mergers. High sensitivity required.',
    category: 'org_restructure',
    icon: '👥',
    guidance: 'Transparency is everything - rumors spread fast. Communicate "why" before "what". Address job security concerns directly.'
  },
  {
    id: 'tool_rollout',
    name: 'New Tool Rollout',
    description: 'Introducing new software, platforms, or applications to replace or supplement existing tools.',
    category: 'tool_rollout',
    icon: '📊',
    guidance: 'Hands-on training sessions work better than videos. Create a sandbox environment for practice. Identify and train super-users first.'
  }
]

export default function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <h2 className="text-3xl font-bold text-white">Change Management Templates</h2>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Jump-start your project with pre-built templates based on proven change management frameworks (Prosci ADKAR, Kotter's 8 Steps)
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`
              bg-gray-800 rounded-xl p-6 border-2 transition-all cursor-pointer
              ${selectedTemplate?.id === template.id 
                ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
            onClick={() => setSelectedTemplate(template)}
          >
            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="text-5xl">{template.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {template.description}
                </p>
              </div>
            </div>

            {/* Guidance Preview */}
            {selectedTemplate?.id === template.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">Best Practices</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {template.guidance}
                </p>
              </div>
            )}

            {/* Select Button */}
            {selectedTemplate?.id === template.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectTemplate(template.category)
                }}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
              >
                Use This Template
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State Help */}
      {!selectedTemplate && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            👆 Click a template to see best practices and get started
          </p>
        </div>
      )}
    </div>
  )
}
