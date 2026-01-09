import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { Extension } from '@tiptap/core'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'

export interface MentionItem {
  id: string
  label: string
  type: 'task' | 'project' | 'member'
  icon: string
  description?: string
}

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
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
        <div className="p-2 text-sm text-gray-500">No matching entities</div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-start gap-2 ${
              index === selectedIndex ? 'bg-blue-100' : ''
            }`}
            onClick={() => command(item)}
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              )}
              <div className="text-xs text-gray-400">{item.id}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

MentionList.displayName = 'MentionList'

export interface MentionExtensionOptions {
  getMentionItems: (query: string) => MentionItem[]
}

export const createMentionExtension = (options: MentionExtensionOptions) => {
  return Extension.create({
    name: 'mention',

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '@',
          command: ({ editor, range, props }) => {
            const { id, label } = props as MentionItem

            // Insert mention as markdown link
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent(`[@${label}](${id})`)
              .run()
          },
          items: ({ query }): MentionItem[] => {
            return options.getMentionItems(query)
          },
          render: () => {
            let component: ReactRenderer<MentionListRef> | null = null
            let popup: TippyInstance[] | null = null

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
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
}
