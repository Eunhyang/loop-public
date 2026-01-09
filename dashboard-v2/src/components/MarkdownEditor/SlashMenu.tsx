import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { Extension } from '@tiptap/core'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'

interface CommandItem {
  title: string
  description: string
  icon: string
  command: ({ editor, range }: any) => void
}

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) {
            command(item)
          }
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="p-2 text-sm text-gray-500">No matching commands</div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-start gap-2 ${
              index === selectedIndex ? 'bg-blue-100' : ''
            }`}
            onClick={() => command(item)}
          >
            <span className="text-lg">{item.icon}</span>
            <div>
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'

export const SlashCommandExtension = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        items: ({ query }): CommandItem[] => {
          const commands: CommandItem[] = [
            {
              title: 'Heading 1',
              description: 'Large section heading',
              icon: 'H1',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 1 })
                  .run()
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading',
              icon: 'H2',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 2 })
                  .run()
              },
            },
            {
              title: 'Heading 3',
              description: 'Small section heading',
              icon: 'H3',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHeading({ level: 3 })
                  .run()
              },
            },
            {
              title: 'Bullet List',
              description: 'Unordered list',
              icon: '•',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
              },
            },
            {
              title: 'Numbered List',
              description: 'Ordered list',
              icon: '1.',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
              },
            },
            {
              title: 'Task List',
              description: 'Checkbox list',
              icon: '☐',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run()
              },
            },
            {
              title: 'Code Block',
              description: 'Code with syntax highlighting',
              icon: '</>',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setCodeBlock().run()
              },
            },
            {
              title: 'Quote',
              description: 'Blockquote',
              icon: '"',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setBlockquote().run()
              },
            },
            {
              title: 'Table',
              description: 'Insert a table',
              icon: '⊞',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              },
            },
            {
              title: 'Divider',
              description: 'Horizontal rule',
              icon: '―',
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setHorizontalRule()
                  .run()
              },
            },
            {
              title: 'Image',
              description: 'Upload an image',
              icon: '🖼',
              command: ({ editor, range }) => {
                // Delete the slash command text
                editor.chain().focus().deleteRange(range).run()

                // Create and trigger file input
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    // Trigger the image upload via a custom event scoped to this editor
                    // Use editor.view.dom as the target to scope to this editor instance
                    const event = new CustomEvent('editor:uploadImage', {
                      detail: { file },
                      bubbles: false,
                    })
                    editor.view.dom.dispatchEvent(event)
                  }
                }
                input.click()
              },
            },
          ]

          return commands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null
          let popup: TippyInstance[] | null = null

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },

            onUpdate(props) {
              component?.updateProps(props)

              if (!props.clientRect) {
                return
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              })
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide()
                return true
              }

              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit() {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})
