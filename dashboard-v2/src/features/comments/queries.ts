import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from './api'
import type { CommentCreateRequest, CommentUpdateRequest } from './types'

const commentKeys = {
  all: ['comments'] as const,
  entity: (entityType: string, entityId: string) =>
    [...commentKeys.all, entityType, entityId] as const,
}

export const useComments = (params: {
  entity_type: 'task' | 'project'
  entity_id: string
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: commentKeys.entity(params.entity_type, params.entity_id),
    queryFn: async () => {
      const { data } = await commentsApi.listComments(params)
      return data
    },
    enabled: !!params.entity_id,
  })
}

export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CommentCreateRequest) => commentsApi.createComment(data),
    onSuccess: (_, variables) => {
      // Invalidate comments for the entity
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(variables.entity_type, variables.entity_id),
      })
    },
  })
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      data,
      etag,
    }: {
      commentId: number
      data: CommentUpdateRequest
      etag?: string
    }) => commentsApi.updateComment(commentId, data, etag),
    onSuccess: (response) => {
      // Invalidate comments for the entity
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(response.data.entity_type, response.data.entity_id),
      })
    },
  })
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      hard,
    }: {
      commentId: number
      entityType: 'task' | 'project'
      entityId: string
      hard?: boolean
    }) => commentsApi.deleteComment(commentId, hard),
    onSuccess: (_, variables) => {
      // Invalidate comments for the entity
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(variables.entityType, variables.entityId),
      })
    },
  })
}
