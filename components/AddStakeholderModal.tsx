'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Search, Users, UserPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface GlobalStakeholder {
  id: string
  name: string
  email: string
  role: string
  department: string
  group_name: string | null
  group_color: string | null
}

interface AddStakeholderModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  existingStakeholderIds: string[]
  onStakeholderAdded: () => void
}

export default function AddStakeholderModal({
  isOpen,
  onClose,
  projectId,
  existingStakeholderIds,
  onStakeholderAdded,
}: AddStakeholderModalProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [globalStakeholders, setGlobalStakeholders] = useState<GlobalStakeholder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [adding, setAdding] = useState(false)

  // New stakeholder form
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchGlobalStakeholders()
      setSelectedIds([])
      setSearchQuery('')
      setNewName('')
      setNewRole('')
    }
  }, [isOpen])

  const fetchGlobalStakeholders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/global-stakeholders')
      if (res.ok) {
        const data = await res.json()
        setGlobalStakeholders(data)
      }
    } catch (error) {
      console.error('Error fetching stakeholders:', error)
    }
    setLoading(false)
  }

  // Filter out stakeholders already in this project
  const availableStakeholders = globalStakeholders.filter(
    s => !existingStakeholderIds.includes(s.id)
  )

  // Apply search filter
  const filteredStakeholders = availableStakeholders.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.group_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const addExistingStakeholders = async () => {
    if (selectedIds.length === 0) return
    setAdding(true)

    try {
      // Add each selected stakeholder to the project
      await Promise.all(
        selectedIds.map(stakeholderId =>
          fetch('/api/stakeholders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: projectId,
              stakeholder_id: stakeholderId,
            }),
          })
        )
      )

      toast.success(`Added ${selectedIds.length} stakeholder${selectedIds.length > 1 ? 's' : ''}!`)
      onStakeholderAdded()
      onClose()
    } catch (error) {
      toast.error('Failed to add stakeholders')
      console.error('Error adding stakeholders:', error)
    }
    setAdding(false)
  }

  const addNewStakeholder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newRole.trim()) return
    setAdding(true)

    try {
      await fetch('/api/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: newName,
          role: newRole,
        }),
      })

      toast.success('Stakeholder added!')
      onStakeholderAdded()
      onClose()
    } catch (error) {
      toast.error('Failed to add stakeholder')
      console.error('Error adding stakeholder:', error)
    }
    setAdding(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col border border-zinc-800 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-400" />
            Add Stakeholder
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-4 pb-0">
          <button
            onClick={() => setMode('existing')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'existing'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            From Directory ({availableStakeholders.length})
          </button>
          <button
            onClick={() => setMode('new')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'new'
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {mode === 'existing' ? (
            <div className="flex flex-col h-full">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name, role, department, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredStakeholders.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    {availableStakeholders.length === 0 ? (
                      <>
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>All stakeholders already in project</p>
                        <p className="text-xs mt-1">Create a new one or add people in the directory first</p>
                      </>
                    ) : (
                      <>
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No matches found</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredStakeholders.map(s => {
                    const isSelected = selectedIds.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSelection(s.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500/50'
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                          style={{ backgroundColor: s.group_color || '#6b7280' }}
                        >
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">{s.name}</span>
                            {s.group_name && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: `${s.group_color}20`,
                                  color: s.group_color || '#6b7280',
                                }}
                              >
                                {s.group_name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 truncate">
                            {s.role || 'No role'}{s.department ? ` • ${s.department}` : ''}
                          </p>
                        </div>

                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-zinc-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Selected count */}
              {selectedIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-400">
                  {selectedIds.length} selected
                </div>
              )}
            </div>
          ) : (
            /* New Stakeholder Form */
            <form onSubmit={addNewStakeholder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Role *</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Job title or role"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-zinc-500">
                This will also add them to your global directory for use in other projects.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 font-medium transition-colors"
          >
            Cancel
          </button>
          {mode === 'existing' ? (
            <button
              onClick={addExistingStakeholders}
              disabled={selectedIds.length === 0 || adding}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : `Add ${selectedIds.length || ''} to Project`}
            </button>
          ) : (
            <button
              onClick={addNewStakeholder}
              disabled={!newName.trim() || !newRole.trim() || adding}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : 'Create & Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
