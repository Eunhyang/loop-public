import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { CommentEditor } from './CommentEditor'
import type { Comment, CommentCreateRequest, CommentUpdateRequest } from './types'

interface CommentItemProps {
  comment: Comment
  entityType: 'task' | 'project'
  entityId: string
  currentUserEmail?: string
  onReply: (data: CommentCreateRequest) => void
  onEdit: (commentId: number, data: CommentUpdateRequest, etag: string) => void
  onDelete: (commentId: number) => void
  depth?: number
}

export const CommentItem = ({
  comment,
  entityType,
  entityId,
  currentUserEmail,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentItemProps) => {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isAuthor = currentUserEmail === comment.author.email
  const hasReplies = comment.replies && comment.replies.length > 0
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })

  const handleReply = (data: CommentCreateRequest) => {
    onReply(data)
    setIsReplying(false)
  }

  const handleEdit = (data: CommentUpdateRequest) => {
    onEdit(comment.id, data, comment.updated_at)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id)
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-lg">
            {comment.author.icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium text-sm text-zinc-900">
              {comment.author.name}
            </span>
            <span className="text-xs text-zinc-400">{timeAgo}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-zinc-300 italic">(edited)</span>
            )}
          </div>

          {/* Body */}
          {isEditing ? (
            <div className="mb-2">
              <CommentEditor
                entityType={entityType}
                entityId={entityId}
                initialContent={comment.content}
                onSubmit={(data) =>
                  handleEdit({ content: data.content, mentions: data.mentions })
                }
                onCancel={() => setIsEditing(false)}
                placeholder="Edit your comment..."
                autoFocus
              />
            </div>
          ) : (
            <div className="text-sm text-zinc-700 mb-2">
              <MarkdownEditor value={comment.content} readOnly minHeight="auto" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 text-xs">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reply
                </button>

                {isAuthor && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}

                {hasReplies && (
                  <button
                    type="button"
                    onClick={() => setShowReplies(!showReplies)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                    {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Reply editor */}
          {isReplying && (
            <div className="mt-3">
              <CommentEditor
                entityType={entityType}
                entityId={entityId}
                parentId={comment.id}
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
                autoFocus
              />
            </div>
          )}

          {/* Nested replies */}
          {hasReplies && showReplies && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  entityType={entityType}
                  entityId={entityId}
                  currentUserEmail={currentUserEmail}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
