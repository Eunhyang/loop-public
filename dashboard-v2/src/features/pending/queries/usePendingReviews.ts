import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pendingApi } from '../api';

// Query Keys
export const pendingKeys = {
  all: ['pending'] as const,
};

// Fetch all pending reviews (client-side filtering)
export const usePendingReviews = () => {
  return useQuery({
    queryKey: pendingKeys.all,
    queryFn: async () => {
      const { data } = await pendingApi.getPendingReviews();
      return data.reviews;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Approve mutation
export const useApproveReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields?: Record<string, unknown> }) =>
      pendingApi.approve(id, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.all });
    },
  });
};

// Reject mutation
export const useRejectReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pendingApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.all });
    },
  });
};

// Delete mutation
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pendingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingKeys.all });
    },
  });
};
