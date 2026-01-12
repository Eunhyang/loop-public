import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '../queries';
import { taskApi } from '../api';
import { AttachmentItem } from './AttachmentItem';
import { authStorage } from '@/features/auth/storage';

interface AttachmentPanelProps {
    taskId: string;
    readOnly?: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
};

export const AttachmentPanel = ({ taskId, readOnly = false }: AttachmentPanelProps) => {
    const { data: attachmentsData, isLoading } = useAttachments(taskId);
    const uploadMutation = useUploadAttachment();
    const deleteMutation = useDeleteAttachment();

    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const attachments = attachmentsData?.attachments || [];
    const totalSize = attachmentsData?.total_size || 0;

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setError(null);

        // Validate all files with running total (fix for multi-file validation)
        let runningTotal = totalSize;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                setError(`File "${file.name}" exceeds 100MB limit`);
                return;
            }
            if (runningTotal + file.size > MAX_TOTAL_SIZE) {
                setError(`Adding "${file.name}" would exceed 500MB task limit`);
                return;
            }
            runningTotal += file.size;
        }

        // Upload files one by one
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileKey = `${file.name}-${Date.now()}`;

            try {
                setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));

                await uploadMutation.mutateAsync({
                    taskId,
                    file,
                    onProgress: (progress) => {
                        setUploadProgress(prev => ({ ...prev, [fileKey]: progress }));
                    },
                });

                // Remove progress after success
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                });
            } catch (err: any) {
                setError(`Failed to upload "${file.name}": ${err.message || 'Unknown error'}`);
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[fileKey];
                    return newProgress;
                });
            }
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleUpload(e.dataTransfer.files);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDownload = (filename: string) => {
        taskApi.downloadAttachment(taskId, filename).catch((err) => {
            setError(`Failed to download: ${err.message || 'Unknown error'}`);
        });
    };

    const handlePreview = async (filename: string) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}/attachments/${encodeURIComponent(filename)}`, {
                headers: {
                    'Authorization': `Bearer ${authStorage.getToken() || ''}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch file');

            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            // 텍스트 파일: UTF-8로 디코딩 후 Blob 생성 (한글 깨짐 방지)
            if (contentType.startsWith('text/')) {
                const text = await response.text();
                const blob = new Blob([text], { type: 'text/plain; charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                // 바이너리 파일 (PDF, 이미지 등)은 그대로
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            }
        } catch (err: any) {
            setError(`Failed to open file: ${err.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Delete "${filename}"?`)) return;

        try {
            await deleteMutation.mutateAsync({ taskId, filename });
        } catch (err: any) {
            setError(`Failed to delete: ${err.message || 'Unknown error'}`);
        }
    };

    const activeUploads = Object.keys(uploadProgress);
    const isApproachingLimit = totalSize > MAX_TOTAL_SIZE * 0.8; // 80% of limit

    if (isLoading) {
        return <div className="text-sm text-zinc-500">Loading attachments...</div>;
    }

    return (
        <div className="space-y-3">
            {/* Error Message */}
            {error && (
                <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-400 hover:text-red-600"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Storage Warning */}
            {isApproachingLimit && (
                <div className="p-2 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                    ⚠ Total size: {formatFileSize(totalSize)} / 500MB (approaching limit)
                </div>
            )}

            {/* Upload Zone (only if not read-only) */}
            {!readOnly && (
                <>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-zinc-300 hover:border-zinc-400'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files)}
                        />
                        <p className="text-sm text-zinc-600 mb-2">
                            Drag and drop files here, or{' '}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-xs text-zinc-400">
                            Max 100MB per file, 500MB total per task
                        </p>
                    </div>

                    {/* Upload Progress */}
                    {activeUploads.length > 0 && (
                        <div className="space-y-2">
                            {activeUploads.map((fileKey) => (
                                <div key={fileKey} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-600 truncate">
                                            {fileKey.split('-')[0]}
                                        </span>
                                        <span className="text-zinc-500">{uploadProgress[fileKey]}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${uploadProgress[fileKey]}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Attachments List */}
            {attachments.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {attachments.map((attachment) => (
                        <AttachmentItem
                            key={attachment.filename}
                            attachment={attachment}
                            onDownload={() => handleDownload(attachment.filename)}
                            onDelete={readOnly ? undefined : () => handleDelete(attachment.filename)}
                            onPreview={() => handlePreview(attachment.filename)}
                            isDeleting={deleteMutation.isPending}
                            readOnly={readOnly}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-sm text-zinc-400 text-center py-4">
                    No attachments yet
                </div>
            )}

            {/* Total Count */}
            {attachments.length > 0 && (
                <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-100">
                    {attachments.length} file{attachments.length !== 1 ? 's' : ''} · {formatFileSize(totalSize)}
                </div>
            )}
        </div>
    );
};
