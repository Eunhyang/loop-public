import { useToast } from '@/contexts/ToastContext';
import { generateShareUrl, type EntityType } from '@/utils/url';

interface EntityIdGroupProps {
    id: string;
    type: EntityType;
    className?: string;
}

/**
 * Common component for displaying entity ID (copyable) and Share link button
 * Used at the top of all entity drawers for consistency.
 */
export const EntityIdGroup = ({ id, type, className = '' }: EntityIdGroupProps) => {
    const { showToast } = useToast();

    const copyId = () => {
        if (id) {
            navigator.clipboard.writeText(id);
            showToast('ID copied');
        }
    };

    const copyShareLink = async () => {
        if (id) {
            try {
                const shareLink = generateShareUrl(type, id);
                await navigator.clipboard.writeText(shareLink);
                showToast('Link copied');
            } catch {
                showToast('Copy failed', 'error');
            }
        }
    };

    return (
        <div className={`px-6 pt-4 pb-2 ${className}`}>
            <span
                className="font-mono text-xs text-zinc-400 cursor-pointer hover:text-zinc-900 px-2 py-1 bg-zinc-50 rounded transition-colors"
                onClick={copyId}
                title="Click to copy ID"
            >
                {id}
            </span>
            <button
                type="button"
                onClick={copyShareLink}
                className="ml-2 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Copy share link"
            >
                🔗 Share
            </button>
        </div>
    );
};
