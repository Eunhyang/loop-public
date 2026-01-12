import type { AttachmentInfo } from '@/types';

interface AttachmentItemProps {
    attachment: AttachmentInfo;
    onDownload: () => void;
    onDelete?: () => void;
    onPreview?: () => void;
    isDeleting?: boolean;
    readOnly?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
};

export const AttachmentItem = ({ attachment, onDownload, onDelete, onPreview, isDeleting = false, readOnly = false }: AttachmentItemProps) => {
    return (
        <div className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded group">
            {/* File Icon */}
            <div className="text-zinc-400">
                📄
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
                <button
                    onClick={onPreview}
                    className="text-sm text-zinc-900 truncate block text-left hover:text-blue-600 hover:underline cursor-pointer"
                >
                    {attachment.filename}
                </button>
                <div className="text-xs text-zinc-500">
                    {formatFileSize(attachment.size)}
                    {attachment.uploaded_at && (
                        <span className="ml-2">
                            {new Date(attachment.uploaded_at).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onDownload}
                    className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download"
                >
                    ⬇
                </button>
                {!readOnly && onDelete && (
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                    >
                        {isDeleting ? '⏳' : '🗑'}
                    </button>
                )}
            </div>
        </div>
    );
};
