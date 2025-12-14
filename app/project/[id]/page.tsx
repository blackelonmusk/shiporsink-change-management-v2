'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles, Save, TrendingUp, X, FileText, Trash2, Pencil, Mail, Phone, User as UserIcon, MessageCircle, Users, UserPlus, Image, Upload, Briefcase } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AIChat from '@/components/AIChat'
import Header from '@/components/Header'
import MilestoneSection from '@/components/MilestoneSection'
import ADKARScores from '@/components/ADKARScores'
import MeetingPrepModal from '@/components/MeetingPrepModal'
import { SkeletonCard, SkeletonStats } from '@/components/Skeleton'
import AnimatedCounter from '@/components/AnimatedCounter'
import PageTransition from '@/components/PageTransition'
import { useMilestones } from '@/hooks/useMilestones'
import type { Project, Stakeholder, ProjectAnalytics } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface ScoreHistory {
  id: string
  stakeholder_id: string
  engagement_score: number
  performance_score: number
  recorded_at: string
}

interface TeamMember {
  id: string
  invited_email: string
  created_at: string
}

interface StakeholderScores {
  engagement: number
  performance: number
  awareness_score: number
  desire_score: number
  knowledge_score: number
  ability_score: number
  reinforcement_score: number
}

const STAKEHOLDER_TYPES = [
  { value: 'champion', label: 'Champion', color: 'bg-emerald-500', borderColor: 'border-emerald-500/50', bgMuted: 'bg-emerald-500/10', textColor: 'text-emerald-400', description: 'Actively promotes change' },
  { value: 'early_adopter', label: 'Early Adopter', color: 'bg-cyan-500', borderColor: 'border-cyan-500/50', bgMuted: 'bg-cyan-500/10', textColor: 'text-cyan-400', description: 'Quick to embrace new things' },
  { value: 'neutral', label: 'Neutral', color: 'bg-zinc-500', borderColor: 'border-zinc-500/50', bgMuted: 'bg-zinc-500/10', textColor: 'text-zinc-400', description: 'Waits to see how things go' },
  { value: 'skeptic', label: 'Skeptic', color: 'bg-yellow-500', borderColor: 'border-yellow-500/50', bgMuted: 'bg-yellow-500/10', textColor: 'text-yellow-400', description: 'Questions everything, needs proof' },
  { value: 'resistant', label: 'Resistant', color: 'bg-red-500', borderColor: 'border-red-500/50', bgMuted: 'bg-red-500/10', textColor: 'text-red-400', description: 'Actively pushes back' },
]

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
  'from-orange-500 to-orange-600',
  'from-cyan-500 to-cyan-600',
]

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getBorderColor = (type: string) => {
  const typeInfo = STAKEHOLDER_TYPES.find(t => t.value === type)
  return typeInfo?.borderColor || 'border-zinc-700'
}

const getScoreGradient = (score: number) => {
  if (score < 33) {
    return 'from-red-600 via-red-500 to-orange-500'
  } else if (score < 66) {
    return 'from-orange-500 via-yellow-500 to-yellow-400'
  } else {
    return 'from-yellow-400 via-emerald-500 to-emerald-400'
  }
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { milestones } = useMilestones(projectId)
  const supabase = createClientComponentClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [newStakeholderName, setNewStakeholderName] = useState('')
  const [newStakeholderRole, setNewStakeholderRole] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [editingScores, setEditingScores] = useState<{ [key: string]: StakeholderScores }>({})
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null)
  const [historyData, setHistoryData] = useState<ScoreHistory[]>([])
  const [showTrends, setShowTrends] = useState(false)
  const [editingStakeholder, setEditingStakeholder] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [projectNameEdit, setProjectNameEdit] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Stakeholder profile modal state
  const [showProfile, setShowProfile] = useState(false)
  const [profileStakeholder, setProfileStakeholder] = useState<Stakeholder | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileComments, setProfileComments] = useState('')
  const [profileType, setProfileType] = useState('')

  // Conversation starters state
  const [showConversation, setShowConversation] = useState(false)
  const [conversationStakeholder, setConversationStakeholder] = useState<Stakeholder | null>(null)
  const [conversationStarters, setConversationStarters] = useState('')
  const [loadingConversation, setLoadingConversation] = useState(false)

  // Team sharing state
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Meeting Prep state
  const [meetingPrepStakeholder, setMeetingPrepStakeholder] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    const [projectRes, stakeholdersRes, analyticsRes, teamRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/stakeholders?projectId=${projectId}`),
      fetch(`/api/analytics?projectId=${projectId}`),
      fetch(`/api/team?projectId=${projectId}`),
    ])

    if (projectRes.ok) setProject(await projectRes.json())
    if (stakeholdersRes.ok) {
      const data = await stakeholdersRes.json()
      setStakeholders(data)
      const scores: { [key: string]: StakeholderScores } = {}
      data.forEach((s: any) => {
        scores[s.id] = { 
          engagement: s.engagement_score, 
          performance: s.performance_score,
          awareness_score: s.awareness_score ?? 50,
          desire_score: s.desire_score ?? 50,
          knowledge_score: s.knowledge_score ?? 50,
          ability_score: s.ability_score ?? 50,
          reinforcement_score: s.reinforcement_score ?? 50,
        }
      })
      setEditingScores(scores)
    }
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
    if (teamRes.ok) setTeamMembers(await teamRes.json())
    setLoading(false)
  }

  const fetchHistory = async (stakeholder: Stakeholder) => {
    const res = await fetch(`/api/history?stakeholderId=${stakeholder.id}`)
    if (res.ok) {
      const data = await res.json()
      setHistoryData(data)
      setSelectedStakeholder(stakeholder)
      setShowTrends(true)
    }
  }

  const openProfile = (s: Stakeholder) => {
    setProfileStakeholder(s)
    setProfileName(s.name)
    setProfileRole(s.role)
    setProfileEmail((s as any).email || '')
    setProfilePhone((s as any).phone || '')
    setProfileComments(s.comments || '')
    setProfileType((s as any).stakeholder_type || '')
    setShowProfile(true)
  }

  const openMeetingPrep = (s: Stakeholder) => {
    const scores = editingScores[s.id]
    setMeetingPrepStakeholder({
      ...s,
      email: (s as any).email,
      phone: (s as any).phone,
      stakeholder_type: (s as any).stakeholder_type,
      awareness_score: scores?.awareness_score ?? 50,
      desire_score: scores?.desire_score ?? 50,
      knowledge_score: scores?.knowledge_score ?? 50,
      ability_score: scores?.ability_score ?? 50,
      reinforcement_score: scores?.reinforcement_score ?? 50,
    })
  }

  const saveProfile = async () => {
    if (!profileStakeholder) return

    await fetch('/api/stakeholders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: profileStakeholder.id,
        name: profileName,
        role: profileRole,
        email: profileEmail,
        phone: profilePhone,
        comments: profileComments,
        stakeholder_type: profileType,
      }),
    })

    toast.success('Profile saved!')
    setShowProfile(false)
    fetchData()
  }

  const getConversationStarters = async (s: Stakeholder) => {
    setConversationStakeholder(s)
    setShowConversation(true)
    setLoadingConversation(true)
    setConversationStarters('')

    const typeLabel = STAKEHOLDER_TYPES.find(t => t.value === (s as any).stakeholder_type)?.label || 'Unknown'
    const scores = editingScores[s.id]

    try {
      const response = await fetch('https://shiporsink-ai-api.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Give me 5 specific conversation starters for ${s.name} (${s.role}, ${typeLabel} type). Their engagement is ${s.engagement_score}/100 and performance is ${s.performance_score}/100. ADKAR scores: Awareness ${scores?.awareness_score || 50}, Desire ${scores?.desire_score || 50}, Knowledge ${scores?.knowledge_score || 50}, Ability ${scores?.ability_score || 50}, Reinforcement ${scores?.reinforcement_score || 50}. Notes about them: ${s.comments || 'No notes yet'}. Format as a numbered list with the exact phrases I should say in quotes, followed by a brief explanation of why each works.`,
          projectContext: {
            projectName: project?.name || '',
            status: project?.status || '',
            riskLevel: analytics?.riskAssessment || 0,
            totalEngagement: analytics?.engagementLevel || 0,
            stakeholders: [{
              name: s.name,
              role: s.role,
              engagement: s.engagement_score,
              performance: s.performance_score,
              comments: s.comments || '',
              stakeholder_type: (s as any).stakeholder_type || '',
            }]
          }
        })
      })

      const data = await response.json()
      setConversationStarters(data.response)
    } catch (error) {
      setConversationStarters('Sorry, I encountered an error generating conversation starters. Please try again.')
    }

    setLoadingConversation(false)
  }

  const inviteTeamMember = async () => {
    if (!inviteEmail.trim()) return
    setInviteLoading(true)

    await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        invited_email: inviteEmail.toLowerCase().trim(),
      }),
    })

    try {
      await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inviteEmail.toLowerCase().trim(),
          inviterName: user?.email?.split('@')[0] || 'A team member',
          projectName: project?.name || 'Change Management Project',
          projectUrl: `${window.location.origin}/project/${projectId}`,
        }),
      })
      toast.success('Invite sent! Email notification delivered.')
    } catch (error) {
      toast.success('Team member invited!')
    }

    setInviteEmail('')
    setInviteLoading(false)
    fetchData()
  }

  const removeTeamMember = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return

    await fetch(`/api/team?id=${memberId}`, {
      method: 'DELETE',
    })

    fetchData()
  }

  const addStakeholder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStakeholderName.trim() || !newStakeholderRole.trim()) return

    await fetch('/api/stakeholders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        name: newStakeholderName,
        role: newStakeholderRole,
      }),
    })

    toast.success('Stakeholder added!')
    setNewStakeholderName('')
    setNewStakeholderRole('')
    fetchData()
  }

  const updateScores = async (stakeholderId: string) => {
    const scores = editingScores[stakeholderId]
    if (!scores) return

    await fetch('/api/stakeholders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: stakeholderId,
        engagement_score: scores.engagement,
        performance_score: scores.performance,
      }),
    })

    toast.success('Scores saved!')
    fetchData()
  }

  const updateADKARScores = async (stakeholderId: string) => {
    const scores = editingScores[stakeholderId]
    if (!scores) return

    await fetch('/api/stakeholders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: stakeholderId,
        awareness_score: scores.awareness_score,
        desire_score: scores.desire_score,
        knowledge_score: scores.knowledge_score,
        ability_score: scores.ability_score,
        reinforcement_score: scores.reinforcement_score,
      }),
    })

    toast.success('ADKAR scores saved!')
    fetchData()
  }

  const deleteStakeholder = async (stakeholderId: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return

    await fetch(`/api/stakeholders?id=${stakeholderId}`, {
      method: 'DELETE',
    })

    toast.success('Stakeholder deleted')
    fetchData()
  }

  const startEditingProject = () => {
    setProjectNameEdit(project?.name || '')
    setEditingProjectName(true)
  }

  const saveProjectName = async () => {
    if (!projectNameEdit.trim()) return

    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectNameEdit }),
    })

    setEditingProjectName(false)
    fetchData()
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setUploadingLogo(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl }),
      })

      toast.success('Logo uploaded!')
      fetchData()
    } catch (error) {
      toast.error('Failed to upload logo')
      console.error(error)
    }

    setUploadingLogo(false)
  }

  const removeLogo = async () => {
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: null }),
    })

    toast.success('Logo removed')
    fetchData()
  }

  const handleScoreChange = (stakeholderId: string, type: 'engagement' | 'performance', value: number) => {
    setEditingScores(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        [type]: value
      }
    }))
  }

  const handleADKARScoreChange = (stakeholderId: string, field: string, value: number) => {
    setEditingScores(prev => ({
      ...prev,
      [stakeholderId]: {
        ...prev[stakeholderId],
        [field]: value
      }
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const chartData = historyData.map(h => ({
    date: formatDate(h.recorded_at),
    engagement: h.engagement_score,
    performance: h.performance_score,
  }))

  const getTypeBadge = (type: string) => {
    const typeInfo = STAKEHOLDER_TYPES.find(t => t.value === type)
    if (!typeInfo) return null
    return (
      <span className={`${typeInfo.bgMuted} ${typeInfo.textColor} text-xs px-2 py-0.5 rounded-full border ${typeInfo.borderColor}`}>
        {typeInfo.label}
      </span>
    )
  }

  const projectContext = {
    projectName: project?.name || '',
    status: project?.status || '',
    riskLevel: analytics?.riskAssessment || 0,
    totalEngagement: analytics?.engagementLevel || 0,
    stakeholders: stakeholders.map(s => ({
      name: s.name,
      role: s.role,
      engagement: editingScores[s.id]?.engagement || s.engagement_score,
      performance: editingScores[s.id]?.performance || s.performance_score,
      comments: s.comments || '',
      email: (s as any).email || '',
      phone: (s as any).phone || '',
      stakeholder_type: (s as any).stakeholder_type || '',
      notes: (s as any).notes || '',
    })),
    milestones: (milestones || []).map(m => ({
      name: m.name,
      date: m.date,
      type: m.type,
      status: m.status,
      description: m.description || '',
    })),
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-zinc-800 rounded w-48 mb-8 animate-pulse" />
          <SkeletonStats />
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <div className="h-6 bg-zinc-800 rounded w-32 mb-6 animate-pulse" />
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <Header />

      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {editingProjectName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={projectNameEdit}
                  onChange={(e) => setProjectNameEdit(e.target.value)}
                  className="text-2xl font-bold px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  autoFocus
                />
                <button
                  onClick={saveProjectName}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingProjectName(false)}
                  className="bg-zinc-700 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-600 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                <button
                  onClick={startEditingProject}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              {(project as any).logo_url ? (
                <div className="flex items-center gap-2">
                  <img
                    src={(project as any).logo_url}
                    alt="Logo"
                    className="w-10 h-10 object-contain rounded"
                  />
                  <button
                    onClick={removeLogo}
                    className="text-zinc-400 hover:text-red-400 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 hover:border-zinc-600 disabled:opacity-50 transition-all"
                >
                  <Image className="w-4 h-4" />
                  {uploadingLogo ? 'Uploading...' : 'Add Logo'}
                </button>
              )}
              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-lg hover:shadow-orange-500/25 font-medium"
              >
                <Users className="w-4 h-4" />
                Team {teamMembers.length > 0 && `(${teamMembers.length})`}
              </button>
              <button
                onClick={() => router.push(`/project/${projectId}/report`)}
                className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 hover:border-zinc-600 transition-all"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-orange-500/30 transition-all group">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Stakeholders</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                <AnimatedCounter value={stakeholders.length} />
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-orange-500/30 transition-all group">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Engagement</h3>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                <AnimatedCounter value={analytics?.engagementLevel || 0} />
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-orange-500/30 transition-all group">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Risk Level</h3>
              <p className={`text-4xl font-bold ${
                (analytics?.riskAssessment || 0) >= 75 ? 'text-red-400' :
                (analytics?.riskAssessment || 0) >= 50 ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                <AnimatedCounter value={analytics?.riskAssessment || 0} suffix="%" />
              </p>
            </div>
          </div>

          {/* Stakeholders Section */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-white">Stakeholders</h2>
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all hover:shadow-lg hover:shadow-orange-500/25 font-medium group"
              >
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                Ask AI Coach
              </button>
            </div>

            {/* Add Stakeholder Form */}
            <form onSubmit={addStakeholder} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={newStakeholderName}
                onChange={(e) => setNewStakeholderName(e.target.value)}
                placeholder="Name..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
              <input
                type="text"
                value={newStakeholderRole}
                onChange={(e) => setNewStakeholderRole(e.target.value)}
                placeholder="Role..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center justify-center gap-2 font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </form>

            {/* Stakeholder Cards */}
            <div className="space-y-4">
              {stakeholders.map((s, index) => (
                <div 
                  key={s.id} 
                  className={`bg-zinc-950 border-2 ${getBorderColor((s as any).stakeholder_type)} rounded-xl p-5 transition-all duration-200 hover:shadow-xl animate-fadeIn`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <div
                      className="cursor-pointer hover:bg-zinc-900 rounded-lg p-2 -m-2 flex items-center gap-3 transition-colors"
                      onClick={() => openProfile(s)}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(s.name)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-white text-lg">{s.name}</h3>
                          {getTypeBadge((s as any).stakeholder_type)}
                        </div>
                        <p className="text-sm text-zinc-400">{s.role}</p>
                        {((s as any).email || (s as any).phone) && (
                          <div className="flex gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                            {(s as any).email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {(s as any).email}</span>}
                            {(s as any).phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {(s as any).phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => openMeetingPrep(s)}
                        className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        title="Meeting Prep"
                      >
                        <Briefcase className="w-4 h-4" />
                        Prep
                      </button>
                      <button
                        onClick={() => getConversationStarters(s)}
                        className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 flex items-center gap-1 text-sm font-medium transition-colors"
                        title="Get conversation starters"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => fetchHistory(s)}
                        className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg hover:bg-zinc-700 flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Trends
                      </button>
                      <button
                        onClick={() => updateScores(s.id)}
                        className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => deleteStakeholder(s.id, s.name)}
                        className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Score Sliders */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-400">Engagement</span>
                        <span className="text-white font-medium">{editingScores[s.id]?.engagement || 0}/100</span>
                      </div>
                      <div className="relative">
                        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full bg-gradient-to-r ${getScoreGradient(editingScores[s.id]?.engagement || 0)} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${editingScores[s.id]?.engagement || 0}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingScores[s.id]?.engagement || 0}
                          onChange={(e) => handleScoreChange(s.id, 'engagement', parseInt(e.target.value))}
                          className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer absolute top-0 opacity-0"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-400">Performance</span>
                        <span className="text-white font-medium">{editingScores[s.id]?.performance || 0}/100</span>
                      </div>
                      <div className="relative">
                        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full bg-gradient-to-r ${getScoreGradient(editingScores[s.id]?.performance || 0)} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${editingScores[s.id]?.performance || 0}%` }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingScores[s.id]?.performance || 0}
                          onChange={(e) => handleScoreChange(s.id, 'performance', parseInt(e.target.value))}
                          className="w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer absolute top-0 opacity-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ADKAR Scores Component */}
                  <ADKARScores
                    stakeholderId={s.id}
                    stakeholderName={s.name}
                    awareness={editingScores[s.id]?.awareness_score ?? 50}
                    desire={editingScores[s.id]?.desire_score ?? 50}
                    knowledge={editingScores[s.id]?.knowledge_score ?? 50}
                    ability={editingScores[s.id]?.ability_score ?? 50}
                    reinforcement={editingScores[s.id]?.reinforcement_score ?? 50}
                    onScoreChange={(field, value) => handleADKARScoreChange(s.id, field, value)}
                    onSave={() => updateADKARScores(s.id)}
                  />
                </div>
              ))}
            </div>

            {stakeholders.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Users className="w-8 h-8 text-zinc-500" />
                </div>
                <p className="text-zinc-400 mb-1">No stakeholders yet</p>
                <p className="text-zinc-600 text-sm">Add your first one above!</p>
              </div>
            )}
          </div>

          {/* Milestone Section */}
          <MilestoneSection projectId={projectId} />
        </main>
      </PageTransition>

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 border border-zinc-800 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                Team Members
              </h2>
              <button onClick={() => setShowTeamModal(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-zinc-400 text-sm mb-2 font-medium">Invite by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  onClick={inviteTeamMember}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                They'll see this project in their "Shared With You" section
              </p>
            </div>

            <div className="space-y-2">
              {teamMembers.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">No team members yet</p>
              ) : (
                teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-white">{member.invited_email}</span>
                    </div>
                    <button
                      onClick={() => removeTeamMember(member.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowTeamModal(false)}
                className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stakeholder Profile Modal */}
      {showProfile && profileStakeholder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-zinc-800 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-orange-400" />
                </div>
                Stakeholder Profile
              </h2>
              <button onClick={() => setShowProfile(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Role</label>
                <input
                  type="text"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Stakeholder Type</label>
                <select
                  value={profileType}
                  onChange={(e) => setProfileType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                >
                  <option value="">Select a type...</option>
                  {STAKEHOLDER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label} - {t.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Notes</label>
                <textarea
                  value={profileComments}
                  onChange={(e) => setProfileComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                  placeholder="Any notes about this stakeholder..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveProfile}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium transition-all"
              >
                Save Profile
              </button>
              <button
                onClick={() => setShowProfile(false)}
                className="flex-1 bg-zinc-800 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Starters Modal */}
      {showConversation && conversationStakeholder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto border border-zinc-800 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-orange-400" />
                </div>
                Conversation Starters for {conversationStakeholder.name}
              </h2>
              <button onClick={() => setShowConversation(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingConversation ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{conversationStarters}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConversation(false)}
                className="bg-zinc-800 text-white px-6 py-2.5 rounded-lg hover:bg-zinc-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trends Modal */}
      {showTrends && selectedStakeholder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 rounded-xl w-full max-w-2xl p-6 border border-zinc-800 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedStakeholder.name}</h2>
                <p className="text-zinc-400">{selectedStakeholder.role} - Score History</p>
              </div>
              <button onClick={() => setShowTrends(false)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {chartData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="#f97316"
                      strokeWidth={2}
                      name="Engagement"
                      dot={{ fill: '#f97316', strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Performance"
                      dot={{ fill: '#10b981', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Not enough data yet.</p>
                  <p className="text-sm text-zinc-500">Update scores a few times to see trends.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-zinc-400">Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-zinc-400">Performance</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Prep Modal */}
      <MeetingPrepModal
        isOpen={!!meetingPrepStakeholder}
        onClose={() => setMeetingPrepStakeholder(null)}
        stakeholder={meetingPrepStakeholder || {}}
        projectName={project?.name || ''}
        projectStatus={project?.status || ''}
      />

      <AIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectContext={projectContext}
      />
    </div>
  )
}
