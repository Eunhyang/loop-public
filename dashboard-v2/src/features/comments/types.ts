export interface CommentAuthor {
  email: string
  member_id: string | null
  name: string
  icon: string
}

export interface Comment {
  id: number
  entity_type: 'task' | 'project'
  entity_id: string
  author: CommentAuthor
  content: string
  mentions: string[]
  parent_id: number | null
  replies: Comment[]
  created_at: string
  updated_at: string
}

export interface CommentCreateRequest {
  entity_type: 'task' | 'project'
  entity_id: string
  content: string
  mentions: string[]
  parent_id?: number
}

export interface CommentUpdateRequest {
  content: string
  mentions: string[]
}

export interface CommentsListResponse {
  comments: Comment[]
  total: number
  limit: number
  offset: number
}
