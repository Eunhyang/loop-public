import { Editor } from '@tiptap/react'

interface MenuBarProps {
  editor: Editor | null
}

export const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
        }`}
        aria-label="Bold"
      >
        <strong>B</strong>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('italic') ? 'bg-gray-300 italic' : ''
        }`}
        aria-label="Italic"
      >
        <em>I</em>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('strike') ? 'bg-gray-300 line-through' : ''
        }`}
        aria-label="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-300 font-bold' : ''
        }`}
        aria-label="Heading 2"
      >
        H2
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 3 }) ? 'bg-gray-300 font-bold' : ''
        }`}
        aria-label="Heading 3"
      >
        H3
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('bulletList') ? 'bg-gray-300' : ''
        }`}
        aria-label="Bullet List"
      >
        • List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('orderedList') ? 'bg-gray-300' : ''
        }`}
        aria-label="Numbered List"
      >
        1. List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('taskList') ? 'bg-gray-300' : ''
        }`}
        aria-label="Task List"
      >
        ☐ Tasks
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-mono ${
          editor.isActive('code') ? 'bg-gray-300' : ''
        }`}
        aria-label="Inline Code"
      >
        {'</>'}
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 font-mono ${
          editor.isActive('codeBlock') ? 'bg-gray-300' : ''
        }`}
        aria-label="Code Block"
      >
        {'{ }'}
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
          editor.isActive('blockquote') ? 'bg-gray-300' : ''
        }`}
        aria-label="Blockquote"
      >
        " Quote
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        disabled={editor.isActive('table')}
        className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        aria-label="Insert Table"
      >
        Table
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="px-2 py-1 text-sm rounded hover:bg-gray-200"
        aria-label="Horizontal Rule"
      >
        ―
      </button>
    </div>
  )
}
