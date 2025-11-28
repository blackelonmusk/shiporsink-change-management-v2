'use client';

import { useState } from 'react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { Calendar, Plus, Edit2, Trash2, Flag, CheckCircle2, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  date: string;
  type: 'kickoff' | 'training' | 'golive' | 'review' | 'other';
  status: 'upcoming' | 'in_progress' | 'completed';
  description?: string;
}

interface MilestoneTimelineProps {
  projectId: string;
  milestones: Milestone[];
  onAdd: () => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Milestone['status']) => void;
}

const milestoneTypeColors = {
  kickoff: 'bg-blue-500',
  training: 'bg-purple-500',
  golive: 'bg-green-500',
  review: 'bg-orange-500',
  other: 'bg-gray-500',
};

const milestoneTypeIcons = {
  kickoff: Flag,
  training: Calendar,
  golive: CheckCircle2,
  review: Clock,
  other: Calendar,
};

export default function MilestoneTimeline({
  projectId,
  milestones,
  onAdd,
  onEdit,
  onDelete,
  onUpdateStatus,
}: MilestoneTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getMilestoneStatus = (milestone: Milestone) => {
    const date = new Date(milestone.date);
    if (milestone.status === 'completed') return 'completed';
    if (isToday(date)) return 'in_progress';
    if (isPast(date)) return 'overdue';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Timeline
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track key milestones and project phases
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      {/* Timeline */}
      {sortedMilestones.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No milestones yet. Add your first milestone to start tracking project progress.
          </p>
          <button
            onClick={onAdd}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add Milestone
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Milestones */}
          <div className="space-y-8">
            {sortedMilestones.map((milestone, index) => {
              const Icon = milestoneTypeIcons[milestone.type];
              const status = getMilestoneStatus(milestone);
              const isHovered = hoveredId === milestone.id;

              return (
                <div
                  key={milestone.id}
                  className="relative flex items-start gap-6 group"
                  onMouseEnter={() => setHoveredId(milestone.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Icon */}
                  <div
                    className={`
                      relative z-10 flex items-center justify-center w-16 h-16 rounded-full
                      ${milestoneTypeColors[milestone.type]} text-white
                      ${isHovered ? 'scale-110' : 'scale-100'}
                      transition-transform duration-200
                    `}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {milestone.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {format(new Date(milestone.date), 'MMMM d, yyyy')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(milestone)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit milestone"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(milestone.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {milestone.description && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {milestone.description}
                        </p>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center gap-4">
                        <span
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                            ${
                              status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : status === 'overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'in_progress' && <Clock className="w-3 h-3" />}
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </span>

                        {/* Status Toggle */}
                        {status !== 'completed' && (
                          <button
                            onClick={() => onUpdateStatus(milestone.id, 'completed')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
