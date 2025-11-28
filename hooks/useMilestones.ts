import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Milestone {
  id: string;
  project_id: string;
  name: string;
  date: string;
  type: 'kickoff' | 'training' | 'golive' | 'review' | 'other';
  status: 'upcoming' | 'in_progress' | 'completed';
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CreateMilestoneInput {
  name: string;
  date: string;
  type: Milestone['type'];
  status: Milestone['status'];
  description?: string;
}

interface UpdateMilestoneInput extends Partial<CreateMilestoneInput> {
  milestoneId: string;
}

export function useMilestones(projectId: string) {
  const queryClient = useQueryClient();
  

  // Fetch milestones
  const {
    data: milestones = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/milestones`);
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }
      const data = await response.json();
      return data.milestones as Milestone[];
    },
    enabled: !!projectId,
  });

  // Create milestone
  const createMutation = useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create milestone');
      console.error('Create milestone error:', error);
    },
  });

  // Update milestone
  const updateMutation = useMutation({
    mutationFn: async (input: UpdateMilestoneInput) => {
      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update milestone');
      console.error('Update milestone error:', error);
    },
  });

  // Delete milestone
  const deleteMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await fetch(
        `/api/projects/${projectId}/milestones?milestoneId=${milestoneId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete milestone');
      console.error('Delete milestone error:', error);
    },
  });

  // Update milestone status (convenience method)
  const updateStatus = async (milestoneId: string, status: Milestone['status']) => {
    return updateMutation.mutateAsync({ milestoneId, status });
  };

  return {
    milestones,
    isLoading,
    error,
    createMilestone: createMutation.mutateAsync,
    updateMilestone: updateMutation.mutateAsync,
    deleteMilestone: deleteMutation.mutateAsync,
    updateStatus,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
