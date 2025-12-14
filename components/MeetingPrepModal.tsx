'use client'

import { useState, useEffect } from 'react'
import { X, User, Briefcase, Mail, Phone, TrendingUp, TrendingDown, Minus, Target, Lightbulb, BookOpen, Wrench, RefreshCw, Sparkles, Copy, Check, AlertTriangle, MessageCircle } from 'lucide-react'

interface MeetingPrepModalProps {
  isOpen: boolean
  onClose: () => void
  stakeholder: {
    id: string
    name: string
    role: string
    email?: string
    phone?: string
    comments?: string
    stakeholder_type?: string
    engagement_score: number
    performance_score: number
    awareness_score?: number
    desire_score?: number
    knowledge_score?: number
    ability_score?: number
    reinforcement_score?: number
  }
  projectName: string
  projectStatus: string
}

const STAKEHOLDER_TYPES: Record<string, { label: string; color: string; bgMuted: string; description: string }> = {
  champion: { label: 'Champion', color: 'text-emerald-400', bgMuted: 'bg-emerald-500/10', description: 'Actively promotes change - leverage their influence' },
  early_adopter: { label: 'Early Adopter', color: 'text-cyan-400', bgMuted: 'bg-cyan-500/10', description: 'Quick to embrace new things - good for pilots' },
  neutral: { label: 'Neutral', color: 'text-zinc-400', bgMuted: 'bg-zinc-500/10', description: 'Waiting to see results - needs proof points' },
  skeptic: { label: 'Skeptic', color: 'text-yellow-400', bgMuted: 'bg-yellow-500/10', description: 'Questions everything - address concerns directly' },
  resistant: { label: 'Resistant', color: 'text-red-400', bgMuted: 'bg-red-500/10', description: 'Actively pushes back - identify root cause' },
}

const ADKAR_INFO = [
  { key: 'awareness_score', label: 'Awareness', letter: 'A', icon: Lightbulb, color: 'text-orange-400', focus: 'Share the WHY - business case and personal impact' },
  { key: 'desire_score', label: 'Desire', letter: 'D', icon: Target, color: 'text-pink-400', focus: 'Build WANT - uncover motivations, address concerns' },
  { key: 'knowledge_score', label: 'Knowledge', letter: 'K', icon: BookOpen, color: 'text-cyan-400', focus: 'Teach HOW - training, documentation, examples' },
  { key: 'ability_score', label: 'Ability', letter: 'A', icon: Wrench, color: 'text-emerald-400', focus: 'Enable CAN - remove barriers, provide coaching' },
  { key: 'reinforcement_score', label: 'Reinforcement', letter: 'R', icon: RefreshCw, color: 'text-purple-400', focus: 'Sustain STICK - celebrate wins, address backsliding' },
]

export default function MeetingPrepModal({ isOpen, onClose, stakeholder, projectName, projectStatus }: MeetingPrepModalProps) {
  const [talkingPoints, setTalkingPoints] = useState('')
  const [loadingPoints, setLoadingPoints] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateTalkingPoints()
    }
  }, [isOpen, stakeholder.id])

  const generateTalkingPoints = async () => {
    setLoadingPoints(true)
    setTalkingPoints('')

    const typeInfo = STAKEHOLDER_TYPES[stakeholder.stakeholder_type || '']
    const adkarScores = {
      awareness: stakeholder.awareness_score ?? 50,
      desire: stakeholder.desire_score ?? 50,
      knowledge: stakeholder.knowledge_score ?? 50,
      ability: stakeholder.ability_score ?? 50,
      reinforcement: stakeholder.reinforcement_score ?? 50,
    }

    // Find ADKAR bottleneck
    const lowestAdkar = Object.entries(adkarScores).reduce((lowest, [key, value]) => 
      value < lowest.value ? { key, value } : lowest
    , { key: 'awareness', value: 100 })

    try {
      const response = await fetch('https://shiporsink-ai-api.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `I have a meeting with ${stakeholder.name} (${stakeholder.role}) about our change project "${projectName}". Generate a brief meeting prep with:

1. **Opening Line** - A warm, personalized way to start based on their type (${typeInfo?.label || 'Unknown'})

2. **Key Talking Points** (3-4 bullets) - Based on their current state:
   - Engagement: ${stakeholder.engagement_score}/100
   - Performance: ${stakeholder.performance_score}/100
   - ADKAR bottleneck: ${lowestAdkar.key} at ${lowestAdkar.value}/100
   
3. **Question to Ask** - One powerful question to understand their perspective better

4. **Watch Out For** - One thing to be careful about given their stakeholder type

5. **Ideal Outcome** - What success looks like for this meeting

Keep it concise and actionable. Notes about them: ${stakeholder.comments || 'No notes yet'}`,
          projectContext: {
            projectName,
            status: projectStatus,
            stakeholders: [{
              name: stakeholder.name,
              role: stakeholder.role,
              engagement: stakeholder.engagement_score,
              performance: stakeholder.performance_score,
              stakeholder_type: stakeholder.stakeholder_type || '',
              comments: stakeholder.comments || '',
            }]
          }
        })
      })

      const data = await response.json()
      setTalkingPoints(data.response)
    } catch (error) {
      setTalkingPoints('Unable to generate talking points. Please try again.')
    }

    setLoadingPoints(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreTrend = (score: number) => {
    if (score >= 70) return { icon: TrendingUp, color: 'text-emerald-400', label: 'Strong' }
    if (score >= 40) return { icon: Minus, color: 'text-yellow-400', label: 'Moderate' }
    return { icon: TrendingDown, color: 'text-red-400', label: 'Needs attention' }
  }

  const getLowestADKAR = () => {
    const scores = [
      { ...ADKAR_INFO[0], score: stakeholder.awareness_score ?? 50 },
      { ...ADKAR_INFO[1], score: stakeholder.desire_score ?? 50 },
      { ...ADKAR_INFO[2], score: stakeholder.knowledge_score ?? 50 },
      { ...ADKAR_INFO[3], score: stakeholder.ability_score ?? 50 },
      { ...ADKAR_INFO[4], score: stakeholder.reinforcement_score ?? 50 },
    ]
    return scores.reduce((lowest, current) => current.score < lowest.score ? current : lowest)
  }

  const copyToClipboard = async () => {
    const typeInfo = STAKEHOLDER_TYPES[stakeholder.stakeholder_type || '']
    const lowestAdkar = getLowestADKAR()
    
    const briefText = `
MEETING PREP: ${stakeholder.name}
================================
Role: ${stakeholder.role}
Type: ${typeInfo?.label || 'Not set'}
${stakeholder.email ? `Email: ${stakeholder.email}` : ''}
${stakeholder.phone ? `Phone: ${stakeholder.phone}` : ''}

SCORES
------
Engagement: ${stakeholder.engagement_score}/100
Performance: ${stakeholder.performance_score}/100

ADKAR FOCUS: ${lowestAdkar.label} (${lowestAdkar.score}/100)
${lowestAdkar.focus}

NOTES
-----
${stakeholder.comments || 'No notes'}

TALKING POINTS
--------------
${talkingPoints}
`.trim()

    await navigator.clipboard.writeText(briefText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeInfo = STAKEHOLDER_TYPES[stakeholder.stakeholder_type || '']
  const lowestAdkar = getLowestADKAR()
  const engagementTrend = getScoreTrend(stakeholder.engagement_score)
  const performanceTrend = getScoreTrend(stakeholder.performance_score)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Meeting Prep</h2>
              <p className="text-sm text-zinc-400">{stakeholder.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Brief'}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stakeholder Overview */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Basic Info */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Stakeholder Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span className="text-white font-medium">{stakeholder.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">{stakeholder.role}</span>
                </div>
                {stakeholder.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300 text-sm">{stakeholder.email}</span>
                  </div>
                )}
                {stakeholder.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300 text-sm">{stakeholder.phone}</span>
                  </div>
                )}
              </div>
              
              {typeInfo && (
                <div className={`mt-4 p-3 rounded-lg ${typeInfo.bgMuted} border border-zinc-800`}>
                  <span className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                  <p className="text-xs text-zinc-400 mt-1">{typeInfo.description}</p>
                </div>
              )}
            </div>

            {/* Right: Scores */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Current State</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Engagement</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(stakeholder.engagement_score)}`}>
                      {stakeholder.engagement_score}
                    </span>
                    <engagementTrend.icon className={`w-4 h-4 ${engagementTrend.color}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Performance</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(stakeholder.performance_score)}`}>
                      {stakeholder.performance_score}
                    </span>
                    <performanceTrend.icon className={`w-4 h-4 ${performanceTrend.color}`} />
                  </div>
                </div>
                
                {/* ADKAR Mini View */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-400 text-sm">ADKAR</span>
                  </div>
                  <div className="flex gap-1">
                    {ADKAR_INFO.map((stage) => {
                      const score = stakeholder[stage.key as keyof typeof stakeholder] as number ?? 50
                      const isLowest = stage.key === lowestAdkar.key
                      return (
                        <div
                          key={stage.key}
                          className={`flex-1 h-2 rounded-full ${isLowest ? 'bg-red-500' : score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          title={`${stage.label}: ${score}/100`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {ADKAR_INFO.map((stage) => (
                      <span key={stage.key} className="text-xs text-zinc-500">{stage.letter}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADKAR Focus Area */}
          {lowestAdkar.score < 70 && (
            <div className={`p-4 rounded-xl bg-zinc-950 border-2 border-orange-500/30`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <lowestAdkar.icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-medium">Focus Area: {lowestAdkar.label}</span>
                    <span className="text-zinc-500 text-sm">({lowestAdkar.score}/100)</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{lowestAdkar.focus}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {stakeholder.comments && (
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Your Notes</h3>
              <p className="text-zinc-300 text-sm">{stakeholder.comments}</p>
            </div>
          )}

          {/* AI Talking Points */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-medium text-white">AI Talking Points</h3>
              </div>
              <button
                onClick={generateTalkingPoints}
                disabled={loadingPoints}
                className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
            
            {loadingPoints ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{talkingPoints}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4 flex justify-end gap-3">
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
