'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, Target, BookOpen, Wrench, RefreshCw, Sparkles } from 'lucide-react'

interface ADKARScoresProps {
  stakeholderId: string
  stakeholderName: string
  awareness: number
  desire: number
  knowledge: number
  ability: number
  reinforcement: number
  onScoreChange: (field: string, value: number) => void
  onSave: () => void
}

const ADKAR_STAGES = [
  { 
    key: 'awareness', 
    label: 'Awareness', 
    letter: 'A',
    icon: Lightbulb, 
    color: 'orange',
    question: 'Do they understand WHY the change is needed?',
    lowTip: 'Share the business case and impact on their role',
    highTip: 'They understand the why - move to building desire'
  },
  { 
    key: 'desire', 
    label: 'Desire', 
    letter: 'D',
    icon: Target, 
    color: 'pink',
    question: 'Do they WANT to support the change?',
    lowTip: 'Uncover personal motivations and address concerns',
    highTip: 'They want to change - ensure they have the knowledge'
  },
  { 
    key: 'knowledge', 
    label: 'Knowledge', 
    letter: 'K',
    icon: BookOpen, 
    color: 'cyan',
    question: 'Do they know HOW to change?',
    lowTip: 'Provide training, documentation, and examples',
    highTip: 'They know how - focus on building practical ability'
  },
  { 
    key: 'ability', 
    label: 'Ability', 
    letter: 'A',
    icon: Wrench, 
    color: 'emerald',
    question: 'CAN they implement the change?',
    lowTip: 'Remove barriers, provide coaching and practice time',
    highTip: 'They can do it - reinforce the new behaviors'
  },
  { 
    key: 'reinforcement', 
    label: 'Reinforcement', 
    letter: 'R',
    icon: RefreshCw, 
    color: 'purple',
    question: 'Are they SUSTAINING the change?',
    lowTip: 'Celebrate wins, address backsliding, gather feedback',
    highTip: 'Change is sticking - they can help others adopt'
  },
]

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', gradient: 'from-orange-500 to-orange-400' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-400' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500 to-cyan-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-400' },
  }
  return colors[color] || colors.orange
}

export default function ADKARScores({
  stakeholderId,
  stakeholderName,
  awareness,
  desire,
  knowledge,
  ability,
  reinforcement,
  onScoreChange,
  onSave,
}: ADKARScoresProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const scores: Record<string, number> = {
    awareness,
    desire,
    knowledge,
    ability,
    reinforcement,
  }

  // Find the lowest scoring stage (the bottleneck)
  const getBottleneck = () => {
    let lowestStage = ADKAR_STAGES[0]
    let lowestScore = scores[lowestStage.key]
    
    for (const stage of ADKAR_STAGES) {
      if (scores[stage.key] < lowestScore) {
        lowestScore = scores[stage.key]
        lowestStage = stage
      }
    }
    
    return { stage: lowestStage, score: lowestScore }
  }

  const bottleneck = getBottleneck()
  const averageScore = Math.round((awareness + desire + knowledge + ability + reinforcement) / 5)

  return (
    <div className="mt-4 border-t border-zinc-800 pt-4">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {ADKAR_STAGES.map((stage) => {
              const score = scores[stage.key]
              const colorClasses = getColorClasses(stage.color)
              return (
                <div
                  key={stage.key}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${colorClasses.bg} ${colorClasses.text} border ${colorClasses.border}`}
                  title={`${stage.label}: ${score}/100`}
                >
                  {stage.letter}
                </div>
              )
            })}
          </div>
          <span className="text-sm text-zinc-400">
            ADKAR Score: <span className="text-white font-medium">{averageScore}/100</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && bottleneck.score < 50 && (
            <span className={`text-xs px-2 py-1 rounded-md ${getColorClasses(bottleneck.stage.color).bg} ${getColorClasses(bottleneck.stage.color).text} ${getColorClasses(bottleneck.stage.color).border} border`}>
              Focus: {bottleneck.stage.label}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          {/* AI Insight */}
          {bottleneck.score < 60 && (
            <div className={`p-3 rounded-lg ${getColorClasses(bottleneck.stage.color).bg} border ${getColorClasses(bottleneck.stage.color).border}`}>
              <div className="flex items-start gap-2">
                <Sparkles className={`w-4 h-4 mt-0.5 ${getColorClasses(bottleneck.stage.color).text}`} />
                <div>
                  <p className={`text-sm font-medium ${getColorClasses(bottleneck.stage.color).text}`}>
                    {stakeholderName} is stuck at {bottleneck.stage.label}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {bottleneck.stage.lowTip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADKAR Sliders */}
          <div className="space-y-3">
            {ADKAR_STAGES.map((stage) => {
              const score = scores[stage.key]
              const colorClasses = getColorClasses(stage.color)
              const Icon = stage.icon
              const isBottleneck = stage.key === bottleneck.stage.key && bottleneck.score < 60

              return (
                <div 
                  key={stage.key}
                  className={`p-3 rounded-lg bg-zinc-900/50 border ${isBottleneck ? colorClasses.border : 'border-zinc-800'} transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${colorClasses.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${colorClasses.text}`} />
                      </div>
                      <span className="text-sm font-medium text-white">{stage.label}</span>
                      {isBottleneck && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${colorClasses.bg} ${colorClasses.text}`}>
                          Focus here
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${colorClasses.text}`}>{score}/100</span>
                  </div>
                  
                  <p className="text-xs text-zinc-500 mb-2">{stage.question}</p>
                  
                  <div className="relative">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colorClasses.gradient} rounded-full transition-all duration-300`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => onScoreChange(`${stage.key}_score`, parseInt(e.target.value))}
                      className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer absolute top-0 opacity-0"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            Save ADKAR Scores
          </button>
        </div>
      )}
    </div>
  )
}
