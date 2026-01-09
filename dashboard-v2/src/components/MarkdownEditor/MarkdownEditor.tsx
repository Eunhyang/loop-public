import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { createExtensions } from './extensions'
import { SlashCommandExtension } from './SlashMenu'
import { MenuBar } from './MenuBar'
import { TableMenu } from './TableMenu'
import { uploadImage, validateImageFile, isImageFile } from './imageUpload'
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
  taskId?: string // Optional: enables image upload
  onAutoSave?: () => Promise<string> // For create mode: returns taskId after save
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = '200px',
  className = '',
  onBlur,
  taskId,
  onAutoSave,
}: MarkdownEditorProps) => {
  const isInitialMount = useRef(true)
  const lastValue = useRef(value)
  const isProgrammaticUpdate = useRef(false)
  const editorRef = useRef<Editor | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Debounced onChange to avoid excessive calls
  const debouncedOnChange = useDebouncedCallback((md: string) => {
    if (onChange) {
      lastValue.current = md // Update lastValue on user edits
      onChange(md)
    }
  }, 300)

  // Handle image file upload
  const handleImageUpload = async (file: File, editorInstance: Editor) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      // Get taskId (either from prop or from onAutoSave)
      let currentTaskId = taskId
      if (!currentTaskId && onAutoSave) {
        currentTaskId = await onAutoSave()
      }

      if (!currentTaskId) {
        throw new Error('No task ID available for upload')
      }

      // Upload image
      const { url } = await uploadImage(currentTaskId, file)

      // Insert image into editor
      editorInstance.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (error) {
      console.error('Image upload failed:', error)
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload image'
      )
    } finally {
      setUploading(false)
    }
  }

  const editor = useEditor({
    extensions: [...createExtensions(placeholder), SlashCommandExtension],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (_view, event, _slice, _moved) => {
        if (readOnly || !taskId) return false
        const files = Array.from((event as DragEvent).dataTransfer?.files || [])
        const imageFiles = files.filter(isImageFile)
        if (imageFiles.length > 0 && editorRef.current) {
          event.preventDefault()
          imageFiles.forEach((file) => handleImageUpload(file, editorRef.current!))
          return true
        }
        return false
      },
      handlePaste: (_view, event) => {
        if (readOnly || !taskId) return false
        const files = Array.from((event as ClipboardEvent).clipboardData?.files || [])
        const imageFiles = files.filter(isImageFile)
        if (imageFiles.length > 0 && editorRef.current) {
          event.preventDefault()
          imageFiles.forEach((file) => handleImageUpload(file, editorRef.current!))
          return true
        }
        return false
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

  // Keep editorRef in sync with editor for use in event handlers
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

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

  // Listen for image upload events from SlashMenu
  useEffect(() => {
    if (!editor || readOnly || !taskId) return

    const editorDom = editor.view.dom
    const handleImageUploadEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ file: File }>
      if (customEvent.detail?.file) {
        handleImageUpload(customEvent.detail.file, editor)
      }
    }

    editorDom.addEventListener('editor:uploadImage', handleImageUploadEvent)
    return () => {
      editorDom.removeEventListener('editor:uploadImage', handleImageUploadEvent)
    }
  }, [editor, readOnly, taskId])

  if (!editor) {
    return null
  }

  return (
    <div className={`markdown-editor border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {!readOnly && <MenuBar editor={editor} />}
      {uploading && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-700">
          Uploading image...
        </div>
      )}
      {uploadError && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
          {uploadError}
        </div>
      )}
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
      {editor.isActive('table') && !readOnly && <TableMenu editor={editor} />}
    </div>
  )
}
