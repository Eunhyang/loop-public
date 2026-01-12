import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUi } from '@/contexts/UiContext';

interface SidebarItem {
    id: string;
    name: string;
    status?: string;
    count?: number;
}

interface SidebarSectionProps {
    title: string;
    icon?: React.ReactNode;
    items: SidebarItem[];
    type: 'track' | 'hypothesis' | 'condition'; // URL param key
    defaultExpanded?: boolean;
}

export const SidebarSection = ({
    title,
    icon,
    items,
    type,
    defaultExpanded = true
}: SidebarSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [searchParams, setSearchParams] = useSearchParams();
    const { openEntityDrawer } = useUi();

    const activeId = searchParams.get(type);

    const handleItemClick = (id: string) => {
        const newParams = new URLSearchParams(searchParams);

        // Toggle: if clicking active item, remove filter
        if (activeId === id) {
            newParams.delete(type);
        } else {
            newParams.set(type, id);
            // Optional: Clear other filters for clarity? Or allow intersection?
            // Legacy behavior implies filtering by ONE context usually.
            // But user might want Track + Condition. Keeping it simple (additive) for now.
        }

        setSearchParams(newParams);
    };

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:bg-zinc-100 rounded-md transition-colors"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-zinc-400">{icon}</span>}
                    <span>{title}</span>
                </div>
                <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                    ▼
                </span>
            </button>

            {isExpanded && (
                <div className="mt-1 space-y-0.5 px-2">
                    {items.length === 0 && (
                        <div className="px-3 py-1.5 text-xs text-zinc-400 italic">No items</div>
                    )}
                    {items.map((item) => {
                        const isActive = activeId === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className={`
                  w-full text-left px-3 pr-7 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2 relative
                  ${isActive
                                        ? 'bg-zinc-200 text-zinc-900 font-medium'
                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}
                `}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                <span className="truncate flex-1">{item.name}</span>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="text-[10px] text-zinc-400">{item.count}</span>
                                )}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="drawer-icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEntityDrawer({ type, mode: 'view', id: item.id });
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            openEntityDrawer({ type, mode: 'view', id: item.id });
                                        }
                                    }}
                                    aria-label={`View ${item.name}`}
                                    title="View"
                                >
                                    i
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
