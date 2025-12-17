'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Zap, Save, ChevronDown, ChevronUp, Users, Clock, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Stakeholder {
  id: string
  name: string
  role: string
  stakeholder_type?: string
  engagement_score: number
  performance_score: number
  awareness_score?: number
  desire_score?: number
  knowledge_score?: number
  ability_score?: number
  reinforcement_score?: number
  updated_at?: string
}

interface QuickCheckInModalProps {
  isOpen: boolean
  onClose: () => void
  stakeholders: Stakeholder[]
  onSaveAll: (updates: StakeholderUpdate[]) => Promise<void>
}

interface StakeholderUpdate {
  id: string
  engagement_score: number
  performance_score: number
  awareness_score: number
  desire_score: number
  knowledge_score: number
  ability_score: number
  reinforcement_score: number
}

interface LocalScores {
  [stakeholderId: string]: {
    engagement: number
    performance: number
    awareness: number
    desire: number
    knowledge: number
    ability: number
    reinforcement: number
    expanded: boolean
    changed: boolean
  }
}

const STAKEHOLDER_TYPE_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  champion: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  early_adopter: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  neutral: { text: 'text-zinc-400', bg: 'bg-zinc-500/20', border: 'border-zinc-500/30' },
  skeptic: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  resistant: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

const getScoreBarColor = (score: number) => {
  if (score >= 70) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
  if (score >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-400'
  return 'bg-gradient-to-r from-red-500 to-red-400'
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Custom slider component with colored progress bar
const ColoredSlider = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: number
  onChange: (value: number) => void
  label: string
}) => {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className={`font-bold ${getScoreColor(value)}`}>{value}</span>
      </div>
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        {/* Colored progress bar */}
        <div 
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-150 ${getScoreBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
        {/* Slider thumb track */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Visual thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-zinc-300 pointer-events-none transition-all duration-150"
          style={{ left: `calc(${value}% - 8px)` }}
        />
      </div>
    </div>
  )
}

export default function QuickCheckInModal({ isOpen, onClose, stakeholders, onSaveAll }: QuickCheckInModalProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [localScores, setLocalScores] = useState<LocalScores>({})
  const prevIsOpenRef = useRef(false)

  // Reset scores only when modal opens (not on every render)
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (justOpened && stakeholders.length > 0) {
      const initial: LocalScores = {}
      stakeholders.forEach(s => {
        initial[s.id] = {
          engagement: s.engagement_score ?? 0,
          performance: s.performance_score ?? 0,
          awareness: s.awareness_score ?? 50,
          desire: s.desire_score ?? 50,
          knowledge: s.knowledge_score ?? 50,
          ability: s.ability_score ?? 50,
          reinforcement: s.reinforcement_score ?? 50,
          expanded: false,
          changed: false,
        }
      })
      setLocalScores(initial)
    }
  }, [isOpen, stakeholders])

  const updateScore = (stakeholderId: string, field: string, value: number) => {
    setLocalScores(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        [field]: value,
        changed: true,
      }
    }))
    setSaved(false)
  }

  const toggleExpanded = (stakeholderId: string) => {
    setLocalScores(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        expanded: !prev[stakeholderId].expanded,
      }
    }))
  }

  const handleSaveAll = async () => {
    setSaving(true)

    const updates: StakeholderUpdate[] = stakeholders
      .filter(s => localScores[s.id]?.changed)
      .map(s => ({
        id: s.id,
        engagement_score: localScores[s.id].engagement,
        performance_score: localScores[s.id].performance,
        awareness_score: localScores[s.id].awareness,
        desire_score: localScores[s.id].desire,
        knowledge_score: localScores[s.id].knowledge,
        ability_score: localScores[s.id].ability,
        reinforcement_score: localScores[s.id].reinforcement,
      }))

    if (updates.length === 0) {
      toast.error('No changes to save')
      setSaving(false)
      return
    }

    await onSaveAll(updates)

    // Mark all as unchanged
    setLocalScores(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], changed: false }
      })
      return updated
    })

    setSaving(false)
    setSaved(true)
    toast.success(`Updated ${updates.length} stakeholder${updates.length > 1 ? 's' : ''}!`)
  }

  const changedCount = Object.values(localScores).filter(s => s.changed).length

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
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
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Check-in</h2>
              <p className="text-sm text-zinc-400">{stakeholders.length} stakeholders</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stakeholder List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stakeholders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No stakeholders to check in on</p>
            </div>
          ) : (
            stakeholders.map((s, index) => {
              const scores = localScores[s.id]
              if (!scores) return null

              const typeColors = STAKEHOLDER_TYPE_COLORS[s.stakeholder_type || ''] || STAKEHOLDER_TYPE_COLORS.neutral

              return (
                <div
                  key={s.id}
                  className={`bg-zinc-950 rounded-xl border ${scores.changed ? 'border-orange-500/50' : 'border-zinc-800'} p-4 transition-all animate-fadeIn`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Stakeholder Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{s.name}</h3>
                          {scores.changed && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">Modified</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">{s.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {formatLastUpdated(s.updated_at)}
                      </span>
                      {s.stakeholder_type && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${typeColors.text} ${typeColors.bg} ${typeColors.border}`}>
                          {s.stakeholder_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Scores with Colored Bars */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <ColoredSlider
                      label="Engagement"
                      value={scores.engagement}
                      onChange={(value) => updateScore(s.id, 'engagement', value)}
                    />
                    <ColoredSlider
                      label="Performance"
                      value={scores.performance}
                      onChange={(value) => updateScore(s.id, 'performance', value)}
                    />
                  </div>

                  {/* ADKAR Expand Toggle */}
                  <button
                    onClick={() => toggleExpanded(s.id)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-3 transition-colors"
                  >
                    {scores.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {scores.expanded ? 'Hide' : 'Show'} ADKAR scores
                  </button>

                  {/* ADKAR Scores (Expanded) */}
                  {scores.expanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-5 gap-3 animate-fadeIn">
                      {[
                        { key: 'awareness', label: 'A', full: 'Awareness' },
                        { key: 'desire', label: 'D', full: 'Desire' },
                        { key: 'knowledge', label: 'K', full: 'Knowledge' },
                        { key: 'ability', label: 'A', full: 'Ability' },
                        { key: 'reinforcement', label: 'R', full: 'Reinforcement' },
                      ].map((stage) => {
                        const stageValue = scores[stage.key as keyof typeof scores] as number
                        return (
                          <div key={stage.key} className="text-center">
                            <div className={`text-xs font-bold mb-1 ${getScoreColor(stageValue)}`} title={stage.full}>
                              {stage.label}
                            </div>
                            <div className="relative h-16 w-6 mx-auto bg-zinc-800 rounded-full overflow-hidden">
                              {/* Vertical colored bar */}
                              <div 
                                className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-150 ${getScoreBarColor(stageValue)}`}
                                style={{ height: `${stageValue}%` }}
                              />
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={stageValue}
                                onChange={(e) => updateScore(s.id, stage.key, parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                              />
                            </div>
                            <div className={`text-xs mt-1 font-medium ${getScoreColor(stageValue)}`}>
                              {stageValue}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 shrink-0 bg-zinc-900/80 backdrop-blur">
          <div className="text-sm text-zinc-400">
            {changedCount > 0 ? (
              <span className="text-orange-400">{changedCount} unsaved change{changedCount > 1 ? 's' : ''}</span>
            ) : saved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All changes saved
              </span>
            ) : (
              <span>Adjust scores and save</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || changedCount === 0}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
