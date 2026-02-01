'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, Globe, Trash2, Brain } from 'lucide-react'
import { authFetch } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInsight {
  id: string
  insight: string
  insight_type: string
  created_at: string
}

interface CrossProjectContext {
  projects: Array<{
    id: string
    name: string
    status: string
    description?: string
  }>
  stakeholders: Array<{
    id: string
    name: string
    role: string
    group?: { id: string; name: string; color: string } | null
    projectHistory: Array<{
      projectName: string
      projectStatus: string
      stakeholderType: string
      adkarScores: {
        awareness: number
        desire: number
        knowledge: number
        ability: number
        reinforcement: number
      }
      engagementScore: number
      notes?: string
    }>
  }>
  groups: Array<{
    id: string
    name: string
    description?: string
    memberCount: number
    projectHistory: Array<{
      projectName: string
      sentiment: string
      adkarScores: {
        awareness: number
        desire: number
        knowledge: number
        ability: number
        reinforcement: number
      }
    }>
  }>
  insights: {
    totalProjects: number
    activeProjects: number
    totalStakeholders: number
    totalGroups: number
    resistantPatterns: string[]
    championPatterns: string[]
  }
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectContext: {
    projectName: string
    status: string
    riskLevel: number
    totalEngagement: number
    stakeholders: Array<{
      name: string
      role: string
      engagement: number
      performance: number
      comments: string
      email?: string
      phone?: string
      stakeholder_type?: string
      notes?: string
    }>
    milestones?: Array<{
      name: string
      date: string
      type: string
      status: string
      description?: string
    }>
  }
}

export default function AIChat({ isOpen, onClose, projectId, projectContext }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [crossProjectContext, setCrossProjectContext] = useState<CrossProjectContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [insights, setInsights] = useState<ChatInsight[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      inputRef.current?.focus()
      loadChatHistory()
      loadInsights()
      fetchCrossProjectContext()
    }
  }, [isOpen, projectId])

  const loadChatHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await authFetch(`/api/chat-messages?projectId=${projectId}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        const formattedMessages = data.map((m: any) => ({
          role: m.role,
          content: m.content,
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
    setLoadingHistory(false)
  }

  const loadInsights = async () => {
    try {
      const res = await authFetch(`/api/chat-insights?limit=20`)
      if (res.ok) {
        const data = await res.json()
        setInsights(data)
      }
    } catch (error) {
      console.error('Error loading insights:', error)
    }
  }

  const fetchCrossProjectContext = async () => {
    if (crossProjectContext) return
    
    setLoadingContext(true)
    try {
      const res = await authFetch('/api/ai-context')
      if (res.ok) {
        const data = await res.json()
        setCrossProjectContext(data)
      }
    } catch (error) {
      console.error('Error fetching cross-project context:', error)
    }
    setLoadingContext(false)
  }

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      await authFetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          role,
          content,
        }),
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Clear all chat history for this project?')) return
    
    try {
      await authFetch(`/api/chat-messages?projectId=${projectId}`, {
        method: 'DELETE',
      })
      setMessages([])
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return

    const userMessage = question.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // Save user message
    await saveMessage('user', userMessage)

    try {
      // Build enhanced context with cross-project data and memory
      const enhancedContext = {
        ...projectContext,
        // Include recent conversation for context
        recentConversation: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content.substring(0, 500), // Truncate for token efficiency
        })),
        // Include saved insights as memory
        savedInsights: insights.slice(0, 10).map(i => ({
          insight: i.insight,
          type: i.insight_type,
        })),
        crossProjectInsights: crossProjectContext ? {
          totalProjects: crossProjectContext.insights.totalProjects,
          activeProjects: crossProjectContext.insights.activeProjects,
          otherProjects: crossProjectContext.projects
            .filter(p => p.name !== projectContext.projectName)
            .map(p => ({ name: p.name, status: p.status })),
          globalStakeholders: crossProjectContext.stakeholders.map(s => ({
            name: s.name,
            role: s.role,
            group: s.group?.name || null,
            projectHistory: s.projectHistory.map(h => ({
              project: h.projectName,
              type: h.stakeholderType,
              engagement: h.engagementScore,
              lowestADKAR: getLowestADKAR(h.adkarScores),
            })),
          })),
          groups: crossProjectContext.groups.map(g => ({
            name: g.name,
            memberCount: g.memberCount,
            projectHistory: g.projectHistory.map(h => ({
              project: h.projectName,
              sentiment: h.sentiment,
              lowestADKAR: getLowestADKAR(h.adkarScores),
            })),
          })),
          patterns: {
            resistant: crossProjectContext.insights.resistantPatterns,
            champions: crossProjectContext.insights.championPatterns,
          },
        } : null,
      }

      const response = await fetch('https://shiporsink-ai-api.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          projectContext: enhancedContext
        })
      })

      const data = await response.json()
      const assistantMessage = data.response

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      
      // Save assistant message
      await saveMessage('assistant', assistantMessage)

      // Check if we should extract an insight (every 5 messages or on important topics)
      if (messages.length % 5 === 0 || containsImportantTopic(userMessage)) {
        extractInsight(userMessage, assistantMessage)
      }

    } catch (error) {
      const errorMessage = 'Sorry, I encountered an error. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    }

    setIsLoading(false)
  }

  // Check if message contains important topics worth remembering
  const containsImportantTopic = (message: string): boolean => {
    const importantKeywords = ['decision', 'strategy', 'agreed', 'plan', 'action', 'risk', 'blocker', 'deadline', 'priority']
    return importantKeywords.some(keyword => message.toLowerCase().includes(keyword))
  }

  // Extract key insight from conversation
  const extractInsight = async (userMessage: string, assistantMessage: string) => {
    try {
      // Ask AI to extract insight (simplified - in production you'd call Claude)
      // For now, we'll save a summary of the exchange
      const insight = `Discussed: ${userMessage.substring(0, 100)}...`
      
      await authFetch('/api/chat-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          insight,
          insight_type: 'general',
        }),
      })
    } catch (error) {
      console.error('Error extracting insight:', error)
    }
  }

  // Helper to find lowest ADKAR score
  const getLowestADKAR = (scores: { awareness: number; desire: number; knowledge: number; ability: number; reinforcement: number }) => {
    if (!scores) return 'Unknown'
    const entries = [
      { name: 'Awareness', score: scores.awareness },
      { name: 'Desire', score: scores.desire },
      { name: 'Knowledge', score: scores.knowledge },
      { name: 'Ability', score: scores.ability },
      { name: 'Reinforcement', score: scores.reinforcement },
    ]
    const lowest = entries.reduce((min, e) => (e.score || 0) < (min.score || 0) ? e : min, entries[0])
    return `${lowest.name} (${lowest.score || 0})`
  }

  const suggestedQuestions = [
    "What's my biggest risk right now?",
    "How do I improve engagement?",
    "Who has been resistant across projects?",
    "What patterns do you see in my stakeholders?",
    "Who should I focus on first?",
    "What did we discuss last time?"
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Change Coach</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">Powered by Claude</p>
                {crossProjectContext && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Globe className="w-3 h-3" />
                    Cross-project
                  </span>
                )}
                {messages.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    <Brain className="w-3 h-3" />
                    {messages.length} msgs
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-700/50"
                title="Clear chat history"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors hover:bg-gray-700 p-2 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Context summary banner */}
        {crossProjectContext && crossProjectContext.insights.totalProjects > 1 && (
          <div className="px-5 py-2 bg-purple-500/10 border-b border-purple-500/20 text-xs text-purple-300">
            <span className="font-medium">Memory:</span> {crossProjectContext.insights.totalProjects} projects, {messages.length} messages this session
            {insights.length > 0 && <span className="ml-2">• {insights.length} saved insights</span>}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-400 text-sm">Loading history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">How can I help you today?</h3>
              <p className="mb-6 text-sm">
                {crossProjectContext 
                  ? "I remember our past conversations and can see all your projects" 
                  : "Ask me anything about your change management project"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600 rounded-full text-sm text-white transition-all hover:scale-105 border border-gray-600 hover:border-purple-500"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ml-auto' 
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white border border-gray-600'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-600">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">AI Coach</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-slide-in">
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-4 border border-gray-600 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">AI Coach is thinking...</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-5 border-t border-gray-700/50 bg-gray-800/50">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about your project..."
              className="flex-1 px-5 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className={`
                px-5 py-3 rounded-xl font-medium transition-all
                ${input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105 animate-pulse-gentle'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <Send className={`w-5 h-5 ${input.trim() && !isLoading ? 'animate-send-ready' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Chat history is saved
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes send-ready {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-pulse-gentle { animation: pulse-gentle 2s ease-in-out infinite; }
        .animate-send-ready { animation: send-ready 1s ease-in-out infinite; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb { background-color: #374151; border-radius: 3px; }
        .scrollbar-track-transparent::-webkit-scrollbar-track { background-color: transparent; }
      `}</style>
    </div>
  )
}
