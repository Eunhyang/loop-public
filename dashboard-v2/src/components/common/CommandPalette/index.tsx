import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUi } from '@/contexts/UiContext';
import { useCommandSearch, type SearchItem } from './useCommandSearch';

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useUi();
  const {
    query,
    setQuery,
    results,
    selectedIndex,
    moveSelection,
    selectItem,
  } = useCommandSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCommandPaletteOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      // Find the actual option element (not the group wrapper)
      const selectedElement = resultsRef.current.querySelector(`[data-option-index="${selectedIndex}"]`) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectItem(selectedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandPalette();
        break;
      case 'Home':
        e.preventDefault();
        if (results.length > 0) {
          // Set to first item (handled via state in useCommandSearch)
          moveSelection(-selectedIndex);
        }
        break;
      case 'End':
        e.preventDefault();
        if (results.length > 0) {
          // Set to last item
          moveSelection(results.length - 1 - selectedIndex);
        }
        break;
    }
  };

  if (!isCommandPaletteOpen) return null;

  // Group results by type
  const grouped = results.reduce((acc, item, index) => {
    const type = item.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push({ item, index });
    return acc;
  }, {} as Record<string, Array<{ item: SearchItem; index: number }>>);

  const typeLabels: Record<string, string> = {
    command: 'Commands',
    task: 'Tasks',
    project: 'Projects',
    program: 'Programs',
    track: 'Tracks',
    condition: 'Conditions',
    hypothesis: 'Hypotheses',
  };

  const typeOrder = ['command', 'task', 'project', 'program', 'track', 'condition', 'hypothesis'];

  // Render content
  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeCommandPalette();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
    >
      <div className="mt-20 w-full max-w-2xl rounded-lg border border-border bg-surface shadow-2xl">
        {/* Search Input */}
        <div className="border-b border-border p-4">
          <label id="command-palette-title" className="sr-only">Command Palette</label>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, or type > for commands..."
            className="w-full bg-transparent text-lg text-text-main placeholder-text-subtle outline-none"
            role="combobox"
            aria-label="Search"
            aria-expanded={results.length > 0}
            aria-controls="command-palette-listbox"
            aria-activedescendant={selectedIndex >= 0 ? `option-${selectedIndex}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Results */}
        <div
          id="command-palette-listbox"
          ref={resultsRef}
          className="max-h-96 overflow-y-auto p-2"
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <div className="p-8 text-center text-text-subtle">
              {query.trim().length > 0 ? (
                <>
                  <div className="mb-2 text-4xl">🔍</div>
                  <div>No results found</div>
                </>
              ) : (
                <>
                  <div className="mb-2 text-4xl">⌨️</div>
                  <div className="mb-1">Type to search tasks, projects, and more</div>
                  <div className="text-sm">or type <span className="rounded bg-surface-hover px-1 font-mono">&gt;</span> for commands</div>
                </>
              )}
            </div>
          ) : (
            <>
              {typeOrder.map((type) => {
                const items = grouped[type];
                if (!items || items.length === 0) return null;

                return (
                  <div key={type} className="mb-2">
                    <div className="mb-1 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      {typeLabels[type] || type}
                    </div>
                    {items.map(({ item, index }) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        id={`option-${index}`}
                        role="option"
                        aria-selected={index === selectedIndex}
                        data-option-index={index}
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                          index === selectedIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-surface-hover'
                        }`}
                        onClick={() => selectItem(index)}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{item.title}</div>
                          {item.type === 'command' ? (
                            <div className="truncate text-xs text-text-subtle">
                              {item.description}
                            </div>
                          ) : (
                            <div className="truncate text-xs text-text-subtle">
                              {item.meta}
                            </div>
                          )}
                        </div>
                        {item.type !== 'command' && item.badge && (
                          <span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center gap-4 border-t border-border bg-surface-hover px-4 py-2 text-xs text-text-subtle">
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to document.body to avoid z-index issues
  return createPortal(content, document.body);
}
