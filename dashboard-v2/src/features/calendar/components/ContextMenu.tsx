import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    dateStr: string;
    onClose: () => void;
    onAddMeeting: (dateStr: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    dateStr,
    onClose,
    onAddMeeting
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-gray-800 text-white rounded-lg shadow-xl py-1 w-48 border border-gray-700 backdrop-blur-md bg-opacity-90"
            style={{ top: y, left: x }}
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700 mb-1">
                {dateStr}
            </div>
            <button
                onClick={() => onAddMeeting(dateStr)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
                <span>📅</span>
                Add Meeting
            </button>
        </div>
    );
};
