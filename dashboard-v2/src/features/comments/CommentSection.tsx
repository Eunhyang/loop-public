import { useState } from 'react'
import { CommentEditor } from './CommentEditor'
import { CommentItem } from './CommentItem'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from './queries'
import { useDashboardInit } from '@/queries/useDashboardInit'
import type { CommentCreateRequest, CommentUpdateRequest } from './types'

interface CommentSectionProps {
  entityType: 'task' | 'project'
  entityId: string
}

export const CommentSection = ({ entityType, entityId }: CommentSectionProps) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const { data: dashboardData } = useDashboardInit()
  const { data: commentsData, isLoading, error } = useComments({
    entity_type: entityType,
    entity_id: entityId,
    order: sortOrder,
  })

  const createMutation = useCreateComment()
  const updateMutation = useUpdateComment()
  const deleteMutation = useDeleteComment()

  const currentUserEmail = dashboardData?.user?.email

  const handleCreate = (data: CommentCreateRequest) => {
    createMutation.mutate(data)
  }

  const handleUpdate = (
    commentId: number,
    data: CommentUpdateRequest,
    etag: string
  ) => {
    updateMutation.mutate({ commentId, data, etag })
  }

  const handleDelete = (commentId: number) => {
    deleteMutation.mutate({
      commentId,
      entityType,
      entityId,
      hard: false,
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-pulse">Loading comments...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading comments. Please try again.
      </div>
    )
  }

  const comments = commentsData?.comments || []
  const total = commentsData?.total || 0

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Comments {total > 0 && <span className="text-gray-500">({total})</span>}
        </h3>
        {total > 1 && (
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sort: {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
          </button>
        )}
      </div>

      {/* New comment editor */}
      <div className="mb-6">
        <CommentEditor
          entityType={entityType}
          entityId={entityId}
          onSubmit={handleCreate}
          placeholder="Write a comment... (use @ to mention tasks, projects, or members)"
        />
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              currentUserEmail={currentUserEmail}
              onReply={handleCreate}
              onEdit={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Loading states */}
      {(createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving...
        </div>
      )}

      {/* Error states */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Error: {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </div>
      )}
    </div>
  )
}
