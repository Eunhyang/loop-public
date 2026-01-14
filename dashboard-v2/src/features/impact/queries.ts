import { useMutation, useQueryClient } from '@tanstack/react-query';
import { impactApi, ExpectedInferRequest, ExpectedInferResponse, HypothesisInferRequest, HypothesisInferResponse } from './api';
import { queryKeys } from '@/queries/keys';

export const useInferExpectedImpact = () => {
  const queryClient = useQueryClient();

  return useMutation<ExpectedInferResponse, unknown, ExpectedInferRequest>({
    mutationFn: (body) => impactApi.inferExpectedImpact(body),
    onSuccess: (_data, variables) => {
      if (variables?.project_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });
};

export const useInferHypothesisDraft = () => {
  const queryClient = useQueryClient();

  return useMutation<HypothesisInferResponse, unknown, HypothesisInferRequest>({
    mutationFn: (body) => impactApi.inferHypothesisDraft(body),
    onSuccess: (_data, variables) => {
      if (variables?.project_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.project_id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
    },
  });
};
