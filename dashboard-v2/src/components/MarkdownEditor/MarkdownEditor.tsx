import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { createExtensions } from './extensions'
import { SlashCommandExtension } from './SlashMenu'
import { MenuBar } from './MenuBar'
import { TableMenu } from './TableMenu'
import './styles.css'

// Helper to get markdown from editor (tiptap-markdown adds this method)
const getMarkdownFromEditor = (editor: Editor): string => {
  // @ts-ignore - tiptap-markdown adds getMarkdown method to editor.storage.markdown
  return editor.storage.markdown?.getMarkdown?.() || editor.getHTML()
}

export interface MarkdownEditorProps {
  value: string
  onChange?: (markdown: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: string
  className?: string
  onBlur?: () => void
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = '200px',
  className = '',
  onBlur,
}: MarkdownEditorProps) => {
  const isInitialMount = useRef(true)
  const lastValue = useRef(value)
  const isProgrammaticUpdate = useRef(false)

  // Debounced onChange to avoid excessive calls
  const debouncedOnChange = useDebouncedCallback((md: string) => {
    if (onChange) {
      lastValue.current = md // Update lastValue on user edits
      onChange(md)
    }
  }, 300)

  const editor = useEditor({
    extensions: [...createExtensions(placeholder), SlashCommandExtension],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      // Don't emit changes in readOnly mode
      if (readOnly) return

      // Skip onChange for programmatic updates (from external value changes)
      if (isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = false
        return
      }

      // Get markdown from editor
      const markdown = getMarkdownFromEditor(editor)

      // Emit debounced change
      debouncedOnChange(markdown)
    },
    onBlur: () => {
      if (!readOnly) {
        // Flush pending debounced changes immediately on blur
        debouncedOnChange.flush()
        onBlur?.()
      }
    },
  })

  // Sync external value changes to editor
  useEffect(() => {
    if (!editor) return

    // Skip on initial mount (content already set via useEditor)
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastValue.current = value
      return
    }

    // Only update if value actually changed (avoid feedback loops)
    if (value === lastValue.current) return

    // Get current markdown from editor
    const currentMarkdown = getMarkdownFromEditor(editor)

    // Only update if different from current content
    if (value !== currentMarkdown) {
      // Set flag to prevent onChange from firing
      isProgrammaticUpdate.current = true
      // Update content without adding to history
      editor.commands.setContent(value)
      lastValue.current = value
    }
  }, [value, editor])

  // Update editable state when readOnly changes
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [readOnly, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`markdown-editor border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {!readOnly && <MenuBar editor={editor} />}
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
      {editor.isActive('table') && !readOnly && <TableMenu editor={editor} />}
    </div>
  )
}
