'use client'

import { useState } from 'react'
import { X, MessageCircle, Sparkles, RefreshCw, BookmarkPlus, Check, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConversationStartersModalProps {
  isOpen: boolean
  onClose: () => void
  stakeholder: {
    id: string
    name: string
    role: string
    stakeholder_type?: string
    engagement_score: number
    performance_score: number
    comments?: string
    awareness_score?: number
    desire_score?: number
    knowledge_score?: number
    ability_score?: number
    reinforcement_score?: number
  }
  projectId: string
  projectName: string
  projectStatus: string
  riskLevel: number
  engagementLevel: number
}

interface ParsedStarter {
  id: string
  number: number
  phrase: string
  explanation: string
  saved: boolean
  suggestedTag: string
}

const STAKEHOLDER_TYPE_LABELS: Record<string, string> = {
  champion: 'Champion',
  early_adopter: 'Early Adopter',
  neutral: 'Neutral',
  skeptic: 'Skeptic',
  resistant: 'Resistant',
}

// Smart tag suggestion based on content
const suggestTag = (phrase: string, explanation: string): string => {
  const text = (phrase + ' ' + explanation).toLowerCase()
  
  if (text.includes('open') || text.includes('start') || text.includes('hello') || text.includes('hey') || text.includes('morning')) {
    return 'opener'
  }
  if (text.includes('concern') || text.includes('worry') || text.includes('but') || text.includes('pushback') || text.includes('resist')) {
    return 'objection'
  }
  if (text.includes('question') || text.includes('ask') || text.includes('what do you') || text.includes('how do you') || text.includes('?')) {
    return 'question'
  }
  if (text.includes('follow') || text.includes('check in') || text.includes('circle back') || text.includes('touch base')) {
    return 'follow-up'
  }
  if (text.includes('understand') || text.includes('hear you') || text.includes('appreciate') || text.includes('recognize') || text.includes('feel')) {
    return 'empathy'
  }
  if (text.includes('excite') || text.includes('opportunity') || text.includes('benefit') || text.includes('achieve') || text.includes('success')) {
    return 'motivation'
  }
  if (text.includes('next step') || text.includes('commit') || text.includes('agree') || text.includes('move forward')) {
    return 'closing'
  }
  
  return 'opener' // default
}

// Parse AI response into individual starters
const parseStarters = (response: string): ParsedStarter[] => {
  const starters: ParsedStarter[] = []
  
  // Match patterns like "1. ", "1) ", or just numbered lines with quotes
  const lines = response.split('\n')
  let currentStarter: Partial<ParsedStarter> | null = null
  let currentNumber = 0
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Check for numbered line (1., 1), etc.)
    const numberMatch = trimmed.match(/^(\d+)[.\)]\s*(.*)/)
    
    if (numberMatch) {
      // Save previous starter if exists
      if (currentStarter && currentStarter.phrase) {
        starters.push({
          id: `starter-${currentStarter.number}`,
          number: currentStarter.number || 0,
          phrase: currentStarter.phrase,
          explanation: currentStarter.explanation || '',
          saved: false,
          suggestedTag: suggestTag(currentStarter.phrase, currentStarter.explanation || ''),
        })
      }
      
      currentNumber = parseInt(numberMatch[1])
      const content = numberMatch[2]
      
      // Extract quoted phrase if present
      const quoteMatch = content.match(/"([^"]+)"(.*)/)
      if (quoteMatch) {
        currentStarter = {
          number: currentNumber,
          phrase: quoteMatch[1],
          explanation: quoteMatch[2].replace(/^[\s\-–—:]+/, '').trim(),
        }
      } else {
        currentStarter = {
          number: currentNumber,
          phrase: content,
          explanation: '',
        }
      }
    } else if (currentStarter) {
      // Continuation of previous starter (explanation)
      if (currentStarter.explanation) {
        currentStarter.explanation += ' ' + trimmed
      } else {
        // Check if this line has the explanation
        const cleaned = trimmed.replace(/^[\s\-–—:]+/, '').trim()
        if (cleaned) {
          currentStarter.explanation = cleaned
        }
      }
    }
  }
  
  // Don't forget the last one
  if (currentStarter && currentStarter.phrase) {
    starters.push({
      id: `starter-${currentStarter.number}`,
      number: currentStarter.number || 0,
      phrase: currentStarter.phrase,
      explanation: currentStarter.explanation || '',
      saved: false,
      suggestedTag: suggestTag(currentStarter.phrase, currentStarter.explanation || ''),
    })
  }
  
  return starters
}

const TAG_COLORS: Record<string, string> = {
  opener: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  objection: 'bg-red-500/20 text-red-400 border-red-500/30',
  closing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'follow-up': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  question: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  empathy: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  motivation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  escalation: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const TAG_LABELS: Record<string, string> = {
  opener: 'Opener',
  objection: 'Objection Handler',
  closing: 'Closing',
  'follow-up': 'Follow-up',
  question: 'Question',
  empathy: 'Empathy',
  motivation: 'Motivation',
  escalation: 'Escalation',
}

export default function ConversationStartersModal({
  isOpen,
  onClose,
  stakeholder,
  projectId,
  projectName,
  projectStatus,
  riskLevel,
  engagementLevel,
}: ConversationStartersModalProps) {
  const [loading, setLoading] = useState(false)
  const [starters, setStarters] = useState<ParsedStarter[]>([])
  const [rawResponse, setRawResponse] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const generateStarters = async () => {
    setLoading(true)
    setStarters([])
    setRawResponse('')

    const typeLabel = STAKEHOLDER_TYPE_LABELS[stakeholder.stakeholder_type || ''] || 'Unknown'

    try {
      const response = await fetch('https://shiporsink-ai-api.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Give me 5 specific conversation starters for ${stakeholder.name} (${stakeholder.role}, ${typeLabel} type). Their engagement is ${stakeholder.engagement_score}/100 and performance is ${stakeholder.performance_score}/100. ADKAR scores: Awareness ${stakeholder.awareness_score || 50}, Desire ${stakeholder.desire_score || 50}, Knowledge ${stakeholder.knowledge_score || 50}, Ability ${stakeholder.ability_score || 50}, Reinforcement ${stakeholder.reinforcement_score || 50}. Notes about them: ${stakeholder.comments || 'No notes yet'}. Format as a numbered list with the exact phrases I should say in quotes, followed by a brief explanation of why each works.`,
          projectContext: {
            projectName,
            status: projectStatus,
            riskLevel,
            totalEngagement: engagementLevel,
            stakeholders: [{
              name: stakeholder.name,
              role: stakeholder.role,
              engagement: stakeholder.engagement_score,
              performance: stakeholder.performance_score,
              comments: stakeholder.comments || '',
              stakeholder_type: stakeholder.stakeholder_type || '',
            }]
          }
        })
      })

      const data = await response.json()
      setRawResponse(data.response)
      
      const parsed = parseStarters(data.response)
      if (parsed.length > 0) {
        setStarters(parsed)
      }
    } catch (error) {
      setRawResponse('Sorry, I encountered an error generating conversation starters. Please try again.')
    }

    setLoading(false)
  }

  const saveToLibrary = async (starter: ParsedStarter) => {
    setSavingId(starter.id)
    
    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: `${stakeholder.name} - ${TAG_LABELS[starter.suggestedTag] || 'Script'}`,
          content: starter.phrase,
          tags: [starter.suggestedTag],
          stakeholder_type: stakeholder.stakeholder_type || null,
        }),
      })

      if (res.ok) {
        setStarters(prev => prev.map(s => 
          s.id === starter.id ? { ...s, saved: true } : s
        ))
        toast.success('Saved to Script Library!')
      }
    } catch (error) {
      toast.error('Failed to save script')
    }
    
    setSavingId(null)
  }

  // Generate on open
  useState(() => {
    if (isOpen && starters.length === 0 && !loading && !rawResponse) {
      generateStarters()
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-zinc-800 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Conversation Starters</h2>
              <p className="text-sm text-zinc-400">{stakeholder.name} • {stakeholder.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-zinc-400 text-sm">Generating personalized starters...</p>
            </div>
          ) : starters.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                <BookOpen className="w-4 h-4" />
                <span>Click <strong className="text-purple-400">+ Save</strong> to add winning phrases to your Script Library</span>
              </div>
              
              {starters.map((starter, index) => (
                <div 
                  key={starter.id}
                  className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-all animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold flex items-center justify-center">
                          {starter.number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${TAG_COLORS[starter.suggestedTag]}`}>
                          {TAG_LABELS[starter.suggestedTag]}
                        </span>
                      </div>
                      <p className="text-white font-medium mb-1">"{starter.phrase}"</p>
                      {starter.explanation && (
                        <p className="text-sm text-zinc-400">{starter.explanation}</p>
                      )}
                    </div>
                    <button
                      onClick={() => saveToLibrary(starter)}
                      disabled={starter.saved || savingId === starter.id}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                        starter.saved 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                    >
                      {starter.saved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved
                        </>
                      ) : savingId === starter.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : rawResponse ? (
            // Fallback to raw display if parsing failed
            <div className="prose prose-invert max-w-none">
              <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{rawResponse}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 mb-4">Ready to generate conversation starters</p>
              <button
                onClick={generateStarters}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 font-medium transition-all"
              >
                Generate Starters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={generateStarters}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
