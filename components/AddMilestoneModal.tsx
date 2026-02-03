'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Milestone {
  id?: string;
  name: string;
  date: string;
  type: 'kickoff' | 'training' | 'golive' | 'review' | 'other';
  status: 'upcoming' | 'in_progress' | 'completed';
  description?: string;
  meeting_notes?: string;
}

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Omit<Milestone, 'id'>) => Promise<void>;
  editingMilestone?: Milestone | null;
}

const milestoneTypes = [
  { value: 'kickoff', label: 'Project Kickoff', emoji: '🚀' },
  { value: 'training', label: 'Training/Workshops', emoji: '📚' },
  { value: 'golive', label: 'Go-Live Date', emoji: '✅' },
  { value: 'review', label: 'Review/Checkpoint', emoji: '🔍' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

export default function AddMilestoneModal({
  isOpen,
  onClose,
  onSave,
  editingMilestone,
}: AddMilestoneModalProps) {
  const [formData, setFormData] = useState<Omit<Milestone, 'id'>>({
    name: '',
    date: '',
    type: 'other',
    status: 'upcoming',
    description: '',
    meeting_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingMilestone) {
      setFormData({
        name: editingMilestone.name,
        date: editingMilestone.date,
        type: editingMilestone.type,
        status: editingMilestone.status,
        description: editingMilestone.description || '',
        meeting_notes: editingMilestone.meeting_notes || '',
      });
    } else {
      setFormData({
        name: '',
        date: '',
        type: 'other',
        status: 'upcoming',
        description: '',
        meeting_notes: '',
      });
    }
  }, [editingMilestone, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">
            {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Milestone Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Milestone Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Project Kickoff Meeting"
              className="w-full px-4 py-3 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-zinc-800 text-white placeholder-zinc-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-zinc-800 text-white [color-scheme:dark]"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Milestone Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {milestoneTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as Milestone['type'] })}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all
                    ${
                      formData.type === type.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }
                  `}
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="font-medium text-white">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Milestone['status'] })}
              className="w-full px-4 py-3 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-zinc-800 text-white"
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional details about this milestone..."
              rows={3}
              className="w-full px-4 py-3 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-zinc-800 text-white resize-none placeholder-zinc-500"
            />
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Meeting Notes (Optional)
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Paste meeting transcripts or summaries here for AI coaching insights
            </p>
            <textarea
              value={formData.meeting_notes}
              onChange={(e) => setFormData({ ...formData, meeting_notes: e.target.value })}
              placeholder="Paste your meeting transcript, notes, or summary here..."
              rows={6}
              className="w-full px-4 py-3 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-zinc-800 text-white resize-y placeholder-zinc-500 font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-zinc-600 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Saving...' : editingMilestone ? 'Update Milestone' : 'Add Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
