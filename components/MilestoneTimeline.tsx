'use client'

import { useState } from 'react'
import { Plus, Calendar, CheckCircle2, Edit2, Trash2, AlertTriangle, Target } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isFuture, parseISO } from 'date-fns'
import ConfettiExplosion from 'react-confetti-explosion'

interface Milestone {
  id: string
  name: string
  date: string
  type: string
  status: 'upcoming' | 'completed' | 'in_progress'
  description?: string
}

interface MilestoneTimelineProps {
  projectId: string
  milestones: Milestone[]
  onAdd: () => void
  onEdit: (milestone: Milestone) => void
  onDelete: (milestoneId: string) => void
  onUpdateStatus: (milestoneId: string, status: 'upcoming' | 'completed' | 'in_progress') => void
}

const MILESTONE_ICONS: Record<string, string> = {
  kickoff: '🚀',
  training: '📚',
  golive: '✅',
  review: '🔍',
  other: '📌',
}

const MILESTONE_COLORS: Record<string, string> = {
  kickoff: 'from-orange-500 to-orange-600',
  training: 'from-purple-500 to-purple-600',
  golive: 'from-emerald-500 to-emerald-600',
  review: 'from-cyan-500 to-cyan-600',
  other: 'from-zinc-500 to-zinc-600',
}

export default function MilestoneTimeline({
  projectId,
  milestones,
  onAdd,
  onEdit,
  onDelete,
  onUpdateStatus,
}: MilestoneTimelineProps) {
  const [celebratingId, setCelebratingId] = useState<string | null>(null)

  const handleMarkComplete = (milestoneId: string) => {
    setCelebratingId(milestoneId)
    onUpdateStatus(milestoneId, 'completed')
    
    setTimeout(() => {
      setCelebratingId(null)
    }, 3000)
  }

  // Calculate progress
  const completedCount = milestones.filter(m => m.status === 'completed').length
  const totalCount = milestones.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const getMilestoneState = (milestone: Milestone) => {
    const milestoneDate = parseISO(milestone.date)
    
    if (milestone.status === 'completed') {
      return 'completed'
    } else if (isToday(milestoneDate)) {
      return 'today'
    } else if (isPast(milestoneDate)) {
      return 'overdue'
    } else {
      return 'upcoming'
    }
  }

  const getRelativeDate = (dateString: string) => {
    const date = parseISO(dateString)
    
    if (isToday(date)) {
      return 'Today'
    }
    
    const distance = formatDistanceToNow(date, { addSuffix: true })
    return distance.charAt(0).toUpperCase() + distance.slice(1)
  }

  const getOverdueDays = (dateString: string) => {
    const date = parseISO(dateString)
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">Project Timeline</h2>
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="font-medium">
                  {completedCount} of {totalCount} milestones completed
                </span>
                <span className={`font-bold ${progressPercentage === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    progressPercentage === 100 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-400'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Milestone
        </button>
      </div>

      {/* Timeline */}
      {milestones.length === 0 ? (
        // Empty State
        <div className="text-center py-16 bg-zinc-950 rounded-xl border-2 border-dashed border-zinc-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Target className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No milestones yet</h3>
          <p className="text-zinc-500 mb-6">
            Add your first milestone to track project progress!
          </p>
          <button
            onClick={onAdd}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 inline-flex items-center gap-2 font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            <Plus className="w-5 h-5" />
            Create First Milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-zinc-700 to-zinc-800" />

          {/* Milestones */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const state = getMilestoneState(milestone)
              const icon = MILESTONE_ICONS[milestone.type] || MILESTONE_ICONS.other
              const colorGradient = MILESTONE_COLORS[milestone.type] || MILESTONE_COLORS.other
              const isPastMilestone = state === 'completed' || (state === 'overdue' && milestone.status !== 'completed')
              const isOverdue = state === 'overdue'
              const isTodayMilestone = state === 'today'

              return (
                <div
                  key={milestone.id}
                  className={`
                    relative pl-20 transition-all duration-300 animate-fadeIn
                    ${milestone.status === 'completed' ? 'opacity-60' : 'opacity-100'}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Confetti */}
                  {celebratingId === milestone.id && (
                    <div className="absolute left-8 top-0 z-50">
                      <ConfettiExplosion
                        force={0.6}
                        duration={3000}
                        particleCount={50}
                        width={400}
                        colors={['#f97316', '#fb923c', '#10b981', '#34d399', '#fbbf24']}
                      />
                    </div>
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`
                      absolute left-0 w-16 h-16 rounded-full 
                      flex items-center justify-center text-2xl
                      bg-gradient-to-br ${colorGradient}
                      shadow-lg
                      ${isTodayMilestone ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-zinc-950 animate-pulse' : ''}
                      ${milestone.status === 'completed' ? 'ring-4 ring-emerald-500/50 ring-offset-2 ring-offset-zinc-950' : ''}
                      ${isOverdue && milestone.status !== 'completed' ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-zinc-950' : ''}
                      transition-all duration-300
                    `}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    ) : (
                      <span>{icon}</span>
                    )}
                  </div>

                  {/* Content Card */}
                  <div
                    className={`
                      bg-zinc-950 rounded-xl p-5 border-2 transition-all duration-200
                      ${isTodayMilestone ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-zinc-800'}
                      ${isOverdue && milestone.status !== 'completed' ? 'border-red-500/50 bg-red-500/5' : ''}
                      ${milestone.status === 'completed' ? 'border-emerald-500/20' : ''}
                      ${!milestone.status || milestone.status !== 'completed' ? 'hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-xl' : ''}
                    `}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className={`text-lg font-bold ${milestone.status === 'completed' ? 'text-zinc-400 line-through' : 'text-white'}`}>
                            {milestone.name}
                          </h3>
                          
                          {/* Status Badges */}
                          {isTodayMilestone && milestone.status !== 'completed' && (
                            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                              TODAY
                            </span>
                          )}
                          
                          {isOverdue && milestone.status !== 'completed' && (
                            <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {getOverdueDays(milestone.date)} days overdue
                            </span>
                          )}
                          
                          {milestone.status === 'completed' && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(milestone.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-zinc-600">•</span>
                          <span className={isTodayMilestone ? 'text-orange-400 font-medium' : ''}>
                            {getRelativeDate(milestone.date)}
                          </span>
                        </div>

                        {milestone.description && (
                          <p className="text-zinc-500 text-sm mt-2">
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {milestone.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkComplete(milestone.id)}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 flex items-center gap-1.5 text-sm font-medium transition-all"
                            title="Mark as complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(milestone)}
                          className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                          title="Edit milestone"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(milestone.id)}
                          className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
