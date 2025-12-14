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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-800 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full shrink-0"></div>
              <div className="flex-1 h-24 bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full shrink-0"></div>
              <div className="flex-1 h-24 bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full shrink-0"></div>
              <div className="flex-1 h-24 bg-zinc-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-8">
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
