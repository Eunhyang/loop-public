import { useEditor, EditorContent } from '@tiptap/react'
import { useState } from 'react'
import { createExtensions } from '@/components/MarkdownEditor/extensions'
import {
  createMentionExtension,
  type MentionItem,
} from '@/components/MarkdownEditor/MentionExtension'
import { useDashboardInit } from '@/queries/useDashboardInit'
import type { CommentCreateRequest } from './types'

interface CommentEditorProps {
  entityType: 'task' | 'project'
  entityId: string
  parentId?: number
  onSubmit: (data: CommentCreateRequest) => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export const CommentEditor = ({
  entityType,
  entityId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment... (use @ to mention)',
  autoFocus = false,
}: CommentEditorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const { data: dashboardData } = useDashboardInit()

  const getMentionItems = (query: string): MentionItem[] => {
    if (!dashboardData) return []

    const lowerQuery = query.toLowerCase()
    const items: MentionItem[] = []

    // Add tasks
    dashboardData.tasks
      .filter(
        (task) =>
          task.entity_id.toLowerCase().includes(lowerQuery) ||
          task.entity_name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((task) => {
        items.push({
          id: task.entity_id,
          label: task.entity_name,
          type: 'task',
          icon: '📋',
          description: task.entity_id,
        })
      })

    // Add projects
    dashboardData.projects
      .filter(
        (project) =>
          project.entity_id.toLowerCase().includes(lowerQuery) ||
          project.entity_name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((project) => {
        items.push({
          id: project.entity_id,
          label: project.entity_name,
          type: 'project',
          icon: '📁',
          description: project.entity_id,
        })
      })

    // Add members
    dashboardData.members
      .filter(
        (member) =>
          member.id.toLowerCase().includes(lowerQuery) ||
          member.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach((member) => {
        items.push({
          id: member.id,
          label: member.name,
          type: 'member',
          icon: '👤',
          description: member.role,
        })
      })

    return items.slice(0, 10) // Limit total results
  }

  const mentionExtension = createMentionExtension({ getMentionItems })

  const editor = useEditor({
    extensions: [...createExtensions(placeholder), mentionExtension],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] p-3',
      },
    },
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      setHasContent(!!editor.getText().trim())
    },
  })

  const extractMentions = (content: string): string[] => {
    // Extract mentions from markdown links: [@name](id)
    const mentionRegex = /\[@[^\]]+\]\(([^)]+)\)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    return [...new Set(mentions)] // Remove duplicates
  }

  const handleSubmit = () => {
    if (!editor) return

    const content = editor.getText().trim()
    if (!content) return

    // @ts-ignore - tiptap-markdown adds getMarkdown method to editor.storage.markdown
    const markdown = editor.storage.markdown?.getMarkdown?.() || editor.getHTML()
    const mentions = extractMentions(markdown)

    setIsSubmitting(true)

    onSubmit({
      entity_type: entityType,
      entity_id: entityId,
      content: markdown,
      mentions,
      parent_id: parentId,
    })

    // Clear editor after submit
    editor.commands.setContent('')
    setHasContent(false)
    setIsSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit with Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }

    // Cancel with Escape (only if onCancel is provided)
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault()
      onCancel()
    }
  }

  if (!editor) return null

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div onKeyDown={handleKeyDown}>
        <EditorContent editor={editor} />
      </div>
      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Use @ to mention tasks, projects, or members. Cmd+Enter to submit.
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting || !hasContent}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
