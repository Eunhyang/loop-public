import { httpClient } from '@/services/http'
import type {
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentsListResponse,
} from './types'

export const commentsApi = {
  // List comments for an entity
  listComments: (params: {
    entity_type: 'task' | 'project'
    entity_id: string
    limit?: number
    offset?: number
    order?: 'asc' | 'desc'
  }) =>
    httpClient.get<CommentsListResponse>('/api/comments', {
      params,
    }),

  // Create a new comment
  createComment: (data: CommentCreateRequest) =>
    httpClient.post<Comment>('/api/comments', data),

  // Update a comment
  updateComment: (commentId: number, data: CommentUpdateRequest, etag?: string) =>
    httpClient.put<Comment>(`/api/comments/${commentId}`, data, {
      headers: etag ? { 'If-Match': etag } : {},
    }),

  // Delete a comment (soft delete by default)
  deleteComment: (commentId: number, hard?: boolean) =>
    httpClient.delete<{ message: string; comment_id: number; hard: boolean }>(
      `/api/comments/${commentId}`,
      {
        params: hard ? { hard: true } : {},
      }
    ),
}
