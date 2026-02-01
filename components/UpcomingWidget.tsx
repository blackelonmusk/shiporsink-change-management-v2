'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, Check, User, ChevronRight, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/api'

interface Followup {
  id: string
  scheduled_date: string
  title: string
  notes: string | null
  completed: boolean
  stakeholder: {
    id: string
    name: string
    role: string
    stakeholder_type: string
  }
}

interface UpcomingWidgetProps {
  projectId: string
  onViewAll?: () => void
  onRefresh?: () => void
}

const STAKEHOLDER_TYPE_COLORS: Record<string, string> = {
  champion: 'bg-emerald-500',
  early_adopter: 'bg-cyan-500',
  neutral: 'bg-zinc-500',
  skeptic: 'bg-yellow-500',
  resistant: 'bg-red-500',
}

export default function UpcomingWidget({ projectId, onViewAll, onRefresh }: UpcomingWidgetProps) {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchFollowups()
  }, [projectId])

  const fetchFollowups = async () => {
    try {
      const res = await authFetch(`/api/followups?projectId=${projectId}&upcoming=true`)
      if (res.ok) {
        const data = await res.json()
        setFollowups(data)
      }
    } catch (error) {
      console.error('Error fetching followups:', error)
    }
    setLoading(false)
  }

  const markComplete = async (followup: Followup) => {
    // Optimistically remove from UI
    setFollowups(prev => prev.filter(f => f.id !== followup.id))

    // Mark as complete in database
    await authFetch('/api/followups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: followup.id, completed: true }),
    })

    // Show undo toast
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-sm">Follow-up completed</span>
        <button
          onClick={() => {
            undoComplete(followup)
            toast.dismiss(t.id)
          }}
          className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
      </div>
    ), {
      duration: 5000,
      style: {
        background: '#18181b',
        color: '#fff',
        border: '1px solid #3f3f46',
      },
    })

    onRefresh?.()
  }

  const undoComplete = async (followup: Followup) => {
    // Restore in database
    await authFetch('/api/followups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: followup.id, completed: false }),
    })

    // Add back to UI
    setFollowups(prev => [...prev, followup].sort((a, b) => 
      new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    ))

    toast.success('Follow-up restored!')
    onRefresh?.()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)

    if (dateOnly.getTime() === today.getTime()) {
      return { text: 'Today', urgent: true }
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return { text: 'Tomorrow', urgent: false }
    }
    
    // Check if overdue
    if (dateOnly.getTime() < today.getTime()) {
      return { text: 'Overdue', urgent: true, overdue: true }
    }
    
    const diffDays = Math.ceil((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) {
      return { text: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), urgent: false }
    }
    
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
  }

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="h-5 bg-zinc-800 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-12 bg-zinc-800 rounded"></div>
          <div className="h-12 bg-zinc-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (followups.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="font-medium text-white">Upcoming Follow-ups</h3>
        </div>
        <p className="text-sm text-zinc-500">No follow-ups scheduled. Add them in stakeholder profiles!</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="font-medium text-white">Upcoming Follow-ups</h3>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {followups.length}
          </span>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {followups.map((followup, index) => {
          const dateInfo = formatDate(followup.scheduled_date)
          const dotColor = STAKEHOLDER_TYPE_COLORS[followup.stakeholder?.stakeholder_type] || 'bg-zinc-500'
          
          return (
            <div 
              key={followup.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all group animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{followup.title}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {followup.stakeholder?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  (dateInfo as any).overdue
                    ? 'bg-red-500/20 text-red-400'
                    : dateInfo.urgent 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {dateInfo.text}
                </span>
                <button
                  onClick={() => markComplete(followup)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Mark complete (can undo)"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
