'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Zap, MessageCircle, GraduationCap, AlertTriangle, Target, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface AITaskModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  projectStatus: string
  userId: string
  stakeholders: Array<{
    name: string
    role: string
    stakeholder_type?: string
    awareness_score?: number
    desire_score?: number
    knowledge_score?: number
    ability_score?: number
    reinforcement_score?: number
  }>
  milestones: Array<{
    name: string
    date: string
    status?: string
  }>
  riskLevel: number
  engagementLevel: number
}

interface GeneratedTask {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedDays: number
  category: string
  selected: boolean
}

const CATEGORY_ICONS: Record<string, any> = {
  communication: MessageCircle,
  training: GraduationCap,
  stakeholder: Target,
  planning: Calendar,
  risk: AlertTriangle,
  milestone: Zap,
}

const CATEGORY_COLORS: Record<string, string> = {
  communication: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  training: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  stakeholder: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  planning: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  risk: 'bg-red-500/20 text-red-400 border-red-500/30',
  milestone: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default function AITaskModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectStatus,
  userId,
  stakeholders,
  milestones,
  riskLevel,
  engagementLevel,
}: AITaskModalProps) {
  const [tasks, setTasks] = useState<GeneratedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [boards, setBoards] = useState<Array<{ id: string; name: string; workspaceName: string; displayName: string }>>([])
  const [selectedBoard, setSelectedBoard] = useState<string>('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBoards()
      generateTasks()
    }
  }, [isOpen])

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/generate-tasks')
      const data = await response.json()
      
      if (data.success && data.boards) {
        setBoards(data.boards)
        if (data.boards.length > 0 && !selectedBoard) {
          setSelectedBoard(data.boards[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    }
  }

  const generateTasks = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          projectStatus,
          stakeholders,
          milestones,
          riskLevel,
          engagementLevel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate tasks')
      }

      const data = await response.json()

      if (data.success && data.tasks) {
        setTasks(data.tasks.map((t: any) => ({ ...t, selected: true })))
      } else {
        throw new Error(data.error || 'Failed to generate tasks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks')
    } finally {
      setLoading(false)
    }
  }

  const createSelectedTasks = async () => {
    const selectedTasks = tasks.filter(t => t.selected)
    if (selectedTasks.length === 0 || !selectedBoard) return

    setCreating(true)

    try {
      const response = await fetch('/api/generate-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: selectedTasks,
          projectId,
          projectName,
          boardId: selectedBoard,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create tasks')
      }

      const data = await response.json()

      if (data.success) {
        if (data.count > 0) {
          toast.success(`Created ${data.count} tasks in Tick PM!`)
        } else if (data.errors?.length > 0) {
          toast.error(`Failed: ${data.errors[0]}`)
          console.error('Task creation errors:', data.errors)
          return
        } else {
          toast.error('No tasks were created')
          return
        }
        onClose()
        setTasks([])
      } else {
        throw new Error(data.error || 'Failed to create tasks')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks')
      toast.error('Failed to create tasks')
    } finally {
      setCreating(false)
    }
  }

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Task Generator</h2>
                <p className="text-sm text-zinc-500">{projectName}</p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose()
                setTasks([])
                setError(null)
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-zinc-400">Analyzing your change project...</p>
              <p className="text-zinc-600 text-sm mt-1">Generating actionable tasks</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-3">❌ {error}</div>
              <button
                onClick={generateTasks}
                className="text-sm text-orange-400 hover:text-orange-300 font-medium"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => {
                const CategoryIcon = CATEGORY_ICONS[task.category] || Zap
                const categoryColor = CATEGORY_COLORS[task.category] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                
                return (
                  <div
                    key={index}
                    onClick={() => toggleTask(index)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      task.selected
                        ? 'border-orange-500/50 bg-orange-500/5'
                        : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        task.selected
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-zinc-600'
                      }`}>
                        {task.selected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.selected ? 'text-white' : 'text-zinc-400'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-zinc-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* Category */}
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${categoryColor}`}>
                            <CategoryIcon className="w-3 h-3" />
                            {task.category}
                          </span>
                          {/* Priority */}
                          <span className={`text-[10px] px-2 py-1 rounded-full border ${
                            task.priority === 'high'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : task.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                          }`}>
                            {task.priority} priority
                          </span>
                          {/* Duration */}
                          <span className="text-[10px] text-zinc-500">
                            ~{task.estimatedDays} day{task.estimatedDays !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && tasks.length > 0 && (
          <div className="p-5 border-t border-zinc-800 space-y-4 flex-shrink-0">
            {/* Board Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Create tasks in Tick PM board:
              </label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const allSelected = tasks.every(t => t.selected)
                  setTasks(prev => prev.map(t => ({ ...t, selected: !allSelected })))
                }}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {tasks.every(t => t.selected) ? 'Deselect all' : 'Select all'}
              </button>

              <button
                onClick={createSelectedTasks}
                disabled={creating || !tasks.some(t => t.selected) || !selectedBoard}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create {tasks.filter(t => t.selected).length} Task{tasks.filter(t => t.selected).length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
