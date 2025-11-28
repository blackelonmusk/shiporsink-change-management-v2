'use client'

import { useState } from 'react'
import MilestoneTimeline from './MilestoneTimeline'
import AddMilestoneModal from './AddMilestoneModal'
import { useMilestones } from '@/hooks/useMilestones'

interface MilestoneSectionProps {
  projectId: string
}

export default function MilestoneSection({ projectId }: MilestoneSectionProps) {
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<any>(null)
  
  const { 
    milestones, 
    createMilestone, 
    updateMilestone, 
    deleteMilestone, 
    updateStatus,
    isLoading 
  } = useMilestones(projectId)

  const handleSave = async (data: any) => {
    if (editingMilestone) {
      await updateMilestone({ milestoneId: editingMilestone.id, ...data })
    } else {
      await createMilestone(data)
    }
    setIsMilestoneModalOpen(false)
    setEditingMilestone(null)
  }

  const handleEdit = (milestone: any) => {
    setEditingMilestone(milestone)
    setIsMilestoneModalOpen(true)
  }

  const handleClose = () => {
    setIsMilestoneModalOpen(false)
    setEditingMilestone(null)
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <MilestoneTimeline
          projectId={projectId}
          milestones={milestones || []}
          onAdd={() => setIsMilestoneModalOpen(true)}
          onEdit={handleEdit}
          onDelete={deleteMilestone}
          onUpdateStatus={updateStatus}
        />
      </div>

      <AddMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        editingMilestone={editingMilestone}
      />
    </>
  )
}
