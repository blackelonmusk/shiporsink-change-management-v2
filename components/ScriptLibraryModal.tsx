'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen, Plus, Copy, Check, Tag, Trash2, Search, Filter, Star, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Script {
  id: string
  title: string
  content: string
  tags: string[]
  stakeholder_type: string | null
  times_used: number
  created_at: string
  updated_at: string
}

interface ScriptLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSelectScript?: (content: string) => void
}

const AVAILABLE_TAGS = [
  { value: 'opener', label: 'Opener', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'objection', label: 'Objection Handler', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'closing', label: 'Closing', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'question', label: 'Question', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'empathy', label: 'Empathy', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'motivation', label: 'Motivation', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'escalation', label: 'Escalation', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
]

const STAKEHOLDER_TYPES = [
  { value: 'champion', label: 'Champion' },
  { value: 'early_adopter', label: 'Early Adopter' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'skeptic', label: 'Skeptic' },
  { value: 'resistant', label: 'Resistant' },
]

export default function ScriptLibraryModal({ isOpen, onClose, projectId, onSelectScript }: ScriptLibraryModalProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // New script form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [newType, setNewType] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchScripts()
    }
  }, [isOpen, projectId])

  const fetchScripts = async () => {
    setLoading(true)
    try {
      let url = `/api/scripts?projectId=${projectId}`
      if (filterTag) url += `&tag=${filterTag}`
      if (filterType) url += `&stakeholderType=${filterType}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setScripts(data)
      }
    } catch (error) {
      console.error('Error fetching scripts:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchScripts()
    }
  }, [filterTag, filterType])

  const handleCopy = async (script: Script) => {
    await navigator.clipboard.writeText(script.content)
    setCopiedId(script.id)
    setTimeout(() => setCopiedId(null), 2000)
    
    // Increment usage
    await fetch('/api/scripts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: script.id, increment_usage: true }),
    })
    
    if (onSelectScript) {
      onSelectScript(script.content)
    }
    
    toast.success('Copied to clipboard!')
  }

  const handleSave = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle,
          content: newContent,
          tags: newTags,
          stakeholder_type: newType || null,
        }),
      })

      if (res.ok) {
        toast.success('Script saved!')
        setNewTitle('')
        setNewContent('')
        setNewTags([])
        setNewType('')
        setShowAddForm(false)
        fetchScripts()
      }
    } catch (error) {
      toast.error('Failed to save script')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this script?')) return

    await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' })
    toast.success('Script deleted')
    fetchScripts()
  }

  const toggleTag = (tag: string) => {
    setNewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const getTagStyle = (tag: string) => {
    return AVAILABLE_TAGS.find(t => t.value === tag)?.color || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }

  const filteredScripts = scripts.filter(script => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return script.title.toLowerCase().includes(query) || 
             script.content.toLowerCase().includes(query)
    }
    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-zinc-800 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Script Library</h2>
              <p className="text-sm text-zinc-400">{scripts.length} saved scripts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Script
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-zinc-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-zinc-400">
              <Filter className="w-4 h-4" />
              Filters:
            </div>
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All tags</option>
              {AVAILABLE_TAGS.map(tag => (
                <option key={tag.value} value={tag.value}>{tag.label}</option>
              ))}
            </select>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-sm focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All types</option>
              {STAKEHOLDER_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Form */}
          {showAddForm && (
            <div className="mb-4 p-4 bg-zinc-950 rounded-xl border border-orange-500/30 animate-fadeIn">
              <h3 className="text-white font-medium mb-3">New Script</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Script title..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Script content..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none"
                />
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => toggleTag(tag.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                          newTags.includes(tag.value) 
                            ? tag.color 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Best for stakeholder type (optional)</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="">Any type</option>
                    {STAKEHOLDER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Script'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scripts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No scripts saved yet</p>
              <p className="text-zinc-500 text-sm mt-1">Save phrases that work well for reuse</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScripts.map((script, index) => (
                <div 
                  key={script.id}
                  className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-all animate-fadeIn"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white">{script.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(script)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === script.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-zinc-300 text-sm mb-3 whitespace-pre-wrap">{script.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {script.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getTagStyle(tag)}`}
                        >
                          {AVAILABLE_TAGS.find(t => t.value === tag)?.label || tag}
                        </span>
                      ))}
                      {script.stakeholder_type && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {STAKEHOLDER_TYPES.find(t => t.value === script.stakeholder_type)?.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {script.times_used > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Used {script.times_used}x
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(script.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
