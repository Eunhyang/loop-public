import { useState } from 'react';

interface Link {
    label: string;
    url: string;
}

interface LinkEditorProps {
    links: Link[];
    onChange: (links: Link[]) => void;
    readOnly?: boolean;
}

export const LinkEditor = ({ links, onChange, readOnly = false }: LinkEditorProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempLabel, setTempLabel] = useState('');
    const [tempUrl, setTempUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validateUrl = (url: string): boolean => {
        try {
            new URL(url);
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    };

    const handleAdd = () => {
        setError(null);

        // Validation
        if (!tempLabel.trim()) {
            setError('Label is required');
            return;
        }
        if (tempLabel.length > 100) {
            setError('Label must be 100 characters or less');
            return;
        }
        if (!tempUrl.trim()) {
            setError('URL is required');
            return;
        }
        if (!validateUrl(tempUrl)) {
            setError('URL must start with http:// or https://');
            return;
        }
        if (links.length >= 10) {
            setError('Maximum 10 links allowed');
            return;
        }

        // Create new array (immutable update)
        const newLinks = [...links, { label: tempLabel.trim(), url: tempUrl.trim() }];
        onChange(newLinks);

        // Reset form
        setTempLabel('');
        setTempUrl('');
        setEditingIndex(null);
    };

    const handleRemove = (index: number) => {
        // Create new array without the item (immutable)
        const newLinks = links.filter((_, i) => i !== index);
        onChange(newLinks);
    };

    const startAdd = () => {
        setEditingIndex(-1); // -1 indicates adding new
        setTempLabel('');
        setTempUrl('');
        setError(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setTempLabel('');
        setTempUrl('');
        setError(null);
    };

    if (readOnly) {
        // Read-only view
        if (links.length === 0) {
            return <span className="text-zinc-400 text-sm">No links</span>;
        }

        return (
            <div className="space-y-1">
                {links.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline"
                    >
                        {link.label || link.url}
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Existing Links */}
            {links.length > 0 && (
                <div className="space-y-1">
                    {links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate flex-1"
                            >
                                {link.label}
                            </a>
                            <button
                                onClick={() => handleRemove(idx)}
                                className="text-zinc-400 hover:text-red-600 transition-colors"
                                title="Remove link"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {links.length === 0 && editingIndex === null && (
                <span className="text-zinc-400 text-sm">No links yet</span>
            )}

            {/* Add Link Form */}
            {editingIndex === -1 ? (
                <div className="space-y-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                    {error && (
                        <div className="text-xs text-red-600">{error}</div>
                    )}
                    <input
                        type="text"
                        placeholder="Label (e.g., Design Document)"
                        className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                        maxLength={100}
                        autoFocus
                    />
                    <input
                        type="url"
                        placeholder="URL (https://...)"
                        className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAdd}
                            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                // Add Link Button (only if not at max and not editing)
                links.length < 10 && (
                    <button
                        onClick={startAdd}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                        + Add Link
                    </button>
                )
            )}
        </div>
    );
};
