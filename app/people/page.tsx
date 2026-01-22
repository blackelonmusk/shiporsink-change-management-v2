'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, Building2, Plus, Search, Edit2, Trash2, 
  ChevronLeft, UserPlus, FolderPlus, MoreVertical,
  Check, X, Briefcase, Mail, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Group {
  id: string
  name: string
  description: string
  color: string
  created_at: string
}

interface Stakeholder {
  id: string
  name: string
  email: string
  phone: string
  role: string
  title: string
  department: string
  notes: string
  group_id: string | null
  group_name: string | null
  group_color: string | null
  created_at: string
}

const GROUP_COLORS = [
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
]

export default function PeoplePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'people' | 'groups'>('people')
  const [groups, setGroups] = useState<Group[]>([])
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showPersonModal, setShowPersonModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editingPerson, setEditingPerson] = useState<Stakeholder | null>(null)
  
  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '', color: '#6b7280' })
  const [personForm, setPersonForm] = useState({ 
    name: '', email: '', phone: '', role: '', title: '', department: '', notes: '', group_id: '' 
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [groupsRes, stakeholdersRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/global-stakeholders')
      ])
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData)
      }
      
      if (stakeholdersRes.ok) {
        const stakeholdersData = await stakeholdersRes.json()
        setStakeholders(stakeholdersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  // Group CRUD
  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      const method = editingGroup ? 'PATCH' : 'POST'
      const body = editingGroup 
        ? { id: editingGroup.id, ...groupForm }
        : groupForm

      const res = await fetch('/api/groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingGroup ? 'Group updated!' : 'Group created!')
        setShowGroupModal(false)
        setEditingGroup(null)
        setGroupForm({ name: '', description: '', color: '#6b7280' })
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save group')
      }
    } catch (error) {
      toast.error('Failed to save group')
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Delete "${group.name}"? People in this group will become ungrouped.`)) return

    try {
      const res = await fetch(`/api/groups?id=${group.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Group deleted')
        fetchData()
      } else {
        toast.error('Failed to delete group')
      }
    } catch (error) {
      toast.error('Failed to delete group')
    }
  }

  // Person CRUD
  const handleSavePerson = async () => {
    if (!personForm.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      const method = editingPerson ? 'PATCH' : 'POST'
      const body = editingPerson 
        ? { id: editingPerson.id, ...personForm, group_id: personForm.group_id || null }
        : { ...personForm, group_id: personForm.group_id || null }

      const res = await fetch('/api/global-stakeholders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingPerson ? 'Person updated!' : 'Person added!')
        setShowPersonModal(false)
        setEditingPerson(null)
        setPersonForm({ name: '', email: '', phone: '', role: '', title: '', department: '', notes: '', group_id: '' })
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save person')
      }
    } catch (error) {
      toast.error('Failed to save person')
    }
  }

  const handleDeletePerson = async (person: Stakeholder) => {
    if (!confirm(`Delete "${person.name}"? This will also remove them from all projects.`)) return

    try {
      const res = await fetch(`/api/global-stakeholders?id=${person.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Person deleted')
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete person')
      }
    } catch (error) {
      toast.error('Failed to delete person')
    }
  }

  // Filtering
  const filteredStakeholders = stakeholders.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.group_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get stakeholder count per group
  const getGroupMemberCount = (groupId: string) => {
    return stakeholders.filter(s => s.group_id === groupId).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">People & Groups</h1>
              <p className="text-sm text-zinc-500">Manage your organization's stakeholders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'people' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              People ({stakeholders.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'groups' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Groups ({groups.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 w-64"
              />
            </div>

            {/* Add Button */}
            {activeTab === 'people' ? (
              <button
                onClick={() => {
                  setEditingPerson(null)
                  setPersonForm({ name: '', email: '', phone: '', role: '', title: '', department: '', notes: '', group_id: '' })
                  setShowPersonModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Person
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingGroup(null)
                  setGroupForm({ name: '', description: '', color: '#6b7280' })
                  setShowGroupModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                Add Group
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'people' ? (
          <div className="grid gap-3">
            {filteredStakeholders.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No people yet. Add your first stakeholder!</p>
              </div>
            ) : (
              filteredStakeholders.map(person => (
                <div
                  key={person.id}
                  className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                >
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                    style={{ backgroundColor: person.group_color || '#6b7280' }}
                  >
                    {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{person.name}</span>
                      {person.group_name && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${person.group_color}20`, color: person.group_color }}
                        >
                          {person.group_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      {person.role && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {person.role}
                        </span>
                      )}
                      {person.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </span>
                      )}
                      {person.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingPerson(person)
                        setPersonForm({
                          name: person.name,
                          email: person.email || '',
                          phone: person.phone || '',
                          role: person.role || '',
                          title: person.title || '',
                          department: person.department || '',
                          notes: person.notes || '',
                          group_id: person.group_id || '',
                        })
                        setShowPersonModal(true)
                      }}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No groups yet. Create departments or teams!</p>
              </div>
            ) : (
              filteredGroups.map(group => (
                <div
                  key={group.id}
                  className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${group.color}20` }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: group.color }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{group.name}</h3>
                        <p className="text-sm text-zinc-500">
                          {getGroupMemberCount(group.id)} member{getGroupMemberCount(group.id) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingGroup(group)
                          setGroupForm({
                            name: group.name,
                            description: group.description || '',
                            color: group.color,
                          })
                          setShowGroupModal(true)
                        }}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{group.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">
                {editingGroup ? 'Edit Group' : 'Create Group'}
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g., IT Department"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setGroupForm({ ...groupForm, color: color.value })}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        groupForm.color === color.value ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {groupForm.color === color.value && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                {editingGroup ? 'Save Changes' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Modal */}
      {showPersonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <h2 className="text-lg font-semibold text-white">
                {editingPerson ? 'Edit Person' : 'Add Person'}
              </h2>
              <button
                onClick={() => setShowPersonModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={personForm.name}
                  onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Group</label>
                <select
                  value={personForm.group_id}
                  onChange={(e) => setPersonForm({ ...personForm, group_id: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">No group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={personForm.role}
                    onChange={(e) => setPersonForm({ ...personForm, role: e.target.value })}
                    placeholder="Job title"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={personForm.department}
                    onChange={(e) => setPersonForm({ ...personForm, department: e.target.value })}
                    placeholder="Department"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                <input
                  type="email"
                  value={personForm.email}
                  onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={personForm.phone}
                  onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Notes</label>
                <textarea
                  value={personForm.notes}
                  onChange={(e) => setPersonForm({ ...personForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-900">
              <button
                onClick={() => setShowPersonModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePerson}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                {editingPerson ? 'Save Changes' : 'Add Person'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
