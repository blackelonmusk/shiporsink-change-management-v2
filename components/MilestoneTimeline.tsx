'use client'

import { useState } from 'react'
import { Plus, Calendar, CheckCircle2, Circle, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isFuture, parseISO } from 'date-fns'
import ConfettiExplosion from 'react-confetti-explosion'

interface Milestone {
  id: string
  name: string
  date: string
  type: string
  status: string
  description?: string
}

interface MilestoneTimelineProps {
  projectId: string
  milestones: Milestone[]
  onAdd: () => void
  onEdit: (milestone: Milestone) => void
  onDelete: (milestoneId: string) => void
  onUpdateStatus: (milestoneId: string, status: string) => void
}

const MILESTONE_ICONS: Record<string, string> = {
  kickoff: '🚀',
  training: '📚',
  golive: '✅',
  review: '🔍',
  other: '📌',
}

const MILESTONE_COLORS: Record<string, string> = {
  kickoff: 'from-blue-500 to-blue-600',
  training: 'from-purple-500 to-purple-600',
  golive: 'from-green-500 to-green-600',
  review: 'from-orange-500 to-orange-600',
  other: 'from-gray-500 to-gray-600',
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
    
    // Stop confetti after 3 seconds
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
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">Project Timeline</h2>
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="font-medium">
                  {completedCount} of {totalCount} milestones completed
                </span>
                <span className="text-green-400 font-bold">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Milestone
        </button>
      </div>

      {/* Timeline */}
      {milestones.length === 0 ? (
        // Empty State
        <div className="text-center py-16 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-white mb-2">No milestones yet</h3>
          <p className="text-gray-400 mb-6">
            Add your first milestone to track project progress!
          </p>
          <button
            onClick={onAdd}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800" />

          {/* Milestones */}
          <div className="space-y-6">
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
                    relative pl-20 transition-all duration-300
                    ${isPastMilestone && milestone.status !== 'completed' ? 'opacity-100' : ''}
                    ${milestone.status === 'completed' ? 'opacity-70' : 'opacity-100'}
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
                      ${isTodayMilestone ? 'animate-pulse ring-4 ring-purple-500 ring-offset-2 ring-offset-gray-900' : ''}
                      ${milestone.status === 'completed' ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-gray-900' : ''}
                      transition-all duration-300
                    `}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-8 h-8 text-white animate-scale-in" />
                    ) : (
                      <span>{icon}</span>
                    )}
                  </div>

                  {/* Content Card */}
                  <div
                    className={`
                      bg-gray-800 rounded-xl p-5 border-2
                      ${isTodayMilestone ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-gray-700'}
                      ${isOverdue && milestone.status !== 'completed' ? 'border-red-500' : ''}
                      ${milestone.status === 'completed' ? 'border-green-500/30' : ''}
                      hover:shadow-xl transition-all duration-300
                      ${isFuture(parseISO(milestone.date)) && milestone.status !== 'completed' ? 'hover:-translate-y-1' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold ${milestone.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {milestone.name}
                          </h3>
                          
                          {/* Status Badges */}
                          {isTodayMilestone && milestone.status !== 'completed' && (
                            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                              TODAY
                            </span>
                          )}
                          
                          {isOverdue && milestone.status !== 'completed' && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {getOverdueDays(milestone.date)} days overdue
                            </span>
                          )}
                          
                          {milestone.status === 'completed' && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(milestone.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-gray-600">•</span>
                          <span className={isTodayMilestone ? 'text-purple-400 font-bold' : ''}>
                            {getRelativeDate(milestone.date)}
                          </span>
                        </div>

                        {milestone.description && (
                          <p className="text-gray-400 text-sm mt-2">
                            {milestone.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        {milestone.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkComplete(milestone.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm font-medium transition-all hover:scale-105"
                            title="Mark as complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(milestone)}
                          className="bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition-colors"
                          title="Edit milestone"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(milestone.id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
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

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
