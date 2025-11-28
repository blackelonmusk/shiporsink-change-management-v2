'use client';

import { format } from 'date-fns';
import { Flag, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  date: string;
  type: 'kickoff' | 'training' | 'golive' | 'review' | 'other';
  status: 'upcoming' | 'in_progress' | 'completed';
}

interface MilestoneMarkersProps {
  milestones: Milestone[];
  chartStartDate: Date;
  chartEndDate: Date;
  chartWidth: number;
  chartHeight: number;
}

const milestoneTypeColors = {
  kickoff: '#3B82F6', // blue
  training: '#A855F7', // purple
  golive: '#10B981', // green
  review: '#F59E0B', // orange
  other: '#6B7280', // gray
};

const milestoneTypeIcons = {
  kickoff: Flag,
  training: Calendar,
  golive: CheckCircle2,
  review: Clock,
  other: Calendar,
};

export default function MilestoneMarkers({
  milestones,
  chartStartDate,
  chartEndDate,
  chartWidth,
  chartHeight,
}: MilestoneMarkersProps) {
  // Filter milestones within chart date range
  const visibleMilestones = milestones.filter((milestone) => {
    const milestoneDate = new Date(milestone.date);
    return milestoneDate >= chartStartDate && milestoneDate <= chartEndDate;
  });

  // Calculate x position for each milestone
  const getMilestonePosition = (milestoneDate: string) => {
    const date = new Date(milestoneDate);
    const totalDuration = chartEndDate.getTime() - chartStartDate.getTime();
    const milestoneOffset = date.getTime() - chartStartDate.getTime();
    return (milestoneOffset / totalDuration) * chartWidth;
  };

  if (visibleMilestones.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {visibleMilestones.map((milestone) => {
        const xPosition = getMilestonePosition(milestone.date);
        const Icon = milestoneTypeIcons[milestone.type];
        const color = milestoneTypeColors[milestone.type];

        return (
          <div
            key={milestone.id}
            className="absolute top-0 bottom-0 pointer-events-auto"
            style={{ left: `${xPosition}px` }}
          >
            {/* Vertical line */}
            <div
              className="absolute top-0 bottom-0 w-px opacity-50"
              style={{ backgroundColor: color }}
            />

            {/* Icon badge at top */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 group"
              style={{ zIndex: 10 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-help transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
                  <div className="font-semibold">{milestone.name}</div>
                  <div className="text-gray-300 text-xs mt-1">
                    {format(new Date(milestone.date), 'MMM d, yyyy')}
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>

            {/* Label at bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2">
              <div className="text-xs font-medium whitespace-nowrap" style={{ color }}>
                {milestone.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
