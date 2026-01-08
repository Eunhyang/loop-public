import { Editor } from '@tiptap/react'

interface TableMenuProps {
  editor: Editor | null
}

export const TableMenu = ({ editor }: TableMenuProps) => {
  if (!editor || !editor.isActive('table')) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-t border-gray-200 bg-blue-50">
      <span className="px-2 py-1 text-xs text-gray-600">Table:</span>

      <button
        type="button"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="px-2 py-1 text-xs rounded hover:bg-blue-100"
        aria-label="Add row above"
      >
        + Row Above
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="px-2 py-1 text-xs rounded hover:bg-blue-100"
        aria-label="Add row below"
      >
        + Row Below
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="px-2 py-1 text-xs rounded hover:bg-red-100 text-red-700"
        aria-label="Delete row"
      >
        − Row
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="px-2 py-1 text-xs rounded hover:bg-blue-100"
        aria-label="Add column left"
      >
        + Col Left
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="px-2 py-1 text-xs rounded hover:bg-blue-100"
        aria-label="Add column right"
      >
        + Col Right
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="px-2 py-1 text-xs rounded hover:bg-red-100 text-red-700"
        aria-label="Delete column"
      >
        − Col
      </button>

      <div className="w-px h-4 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        className="px-2 py-1 text-xs rounded hover:bg-blue-100"
        aria-label="Toggle header row"
      >
        Toggle Header
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="px-2 py-1 text-xs rounded hover:bg-red-100 text-red-700"
        aria-label="Delete table"
      >
        Delete Table
      </button>
    </div>
  )
}
