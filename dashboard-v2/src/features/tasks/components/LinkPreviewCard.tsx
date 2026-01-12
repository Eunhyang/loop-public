import React from 'react';
import { useLinkPreview } from '../queries';

// SVG Icons as React components
const GlobeIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
);

const XIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

interface LinkPreviewCardProps {
    url: string;
    label: string;
    onRemove?: () => void; // Optional, only in edit mode
    readOnly?: boolean;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
    url,
    label,
    onRemove,
    readOnly = false,
}) => {
    const { data: preview, isLoading, isError } = useLinkPreview(url);

    const handleCardClick = () => {
        if (readOnly || !onRemove) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        onRemove?.();
    };

    // Extract domain from URL
    const getDomain = (url: string) => {
        try {
            const parsed = new URL(url);
            return parsed.hostname;
        } catch {
            return url;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="border border-zinc-200 rounded-lg p-3 animate-pulse">
                <div className="flex gap-3">
                    <div className="w-[60px] h-[60px] bg-zinc-200 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                        <div className="h-3 bg-zinc-200 rounded w-full"></div>
                        <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error or fallback state (no metadata available)
    const hasFallbackOnly = isError || (!preview?.title && !preview?.description && !preview?.image);
    const domain = getDomain(url);

    return (
        <div
            className="relative border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition-colors cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Remove button (edit mode only) */}
            {!readOnly && onRemove && (
                <button
                    onClick={handleRemoveClick}
                    className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Remove link"
                >
                    <XIcon size={16} />
                </button>
            )}

            <div className="flex gap-3 items-start">
                {/* Thumbnail */}
                <div className="w-[60px] h-[60px] flex-shrink-0 rounded overflow-hidden bg-zinc-100 flex items-center justify-center">
                    {preview?.image && !hasFallbackOnly ? (
                        <img
                            src={preview.image}
                            alt={preview.title || label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Hide image on load failure
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : preview?.favicon ? (
                        <img
                            src={preview.favicon}
                            alt="favicon"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                                // Replace with globe icon on favicon failure
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const globeIcon = document.createElement('div');
                                    globeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-400"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                    parent.appendChild(globeIcon.firstChild!);
                                }
                            }}
                        />
                    ) : (
                        <GlobeIcon size={24} className="text-zinc-400" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="font-medium text-sm text-zinc-900 truncate">
                        {preview?.title || label || domain}
                    </div>

                    {/* Description (only if available) */}
                    {preview?.description && !hasFallbackOnly && (
                        <div className="text-xs text-zinc-600 line-clamp-2 mt-1">
                            {preview.description}
                        </div>
                    )}

                    {/* Domain */}
                    <div className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                        <GlobeIcon size={12} />
                        <span>{preview?.site_name || domain}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
