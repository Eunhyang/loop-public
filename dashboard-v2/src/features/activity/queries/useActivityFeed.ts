import { useMemo } from 'react';
import { useComments } from '@/features/comments/queries';
import { useEntityHistory } from './useEntityHistory';
import type {
  ActivityFeedItem,
  CommentActivityItem,
  HistoryActivityItem,
  EntityType,
} from '../types';
import type { Comment } from '@/features/comments/types';

interface UseActivityFeedParams {
  entityType: EntityType;
  entityId: string;
  enabled?: boolean;
}

/**
 * Combined activity feed: Comments + Edit History
 *
 * Merges both data sources, normalizes to common shape, and sorts by timestamp descending
 * Handles partial successes (one source fails, other succeeds)
 */
export function useActivityFeed({
  entityType,
  entityId,
  enabled = true,
}: UseActivityFeedParams) {
  // Fetch comments
  const commentsQuery = useComments({
    entity_type: entityType as 'task' | 'project',
    entity_id: entityId,
  });

  // Fetch entity history
  const historyQuery = useEntityHistory({
    entityId,
    enabled: enabled && !!entityId,
  });

  // Transform comments to activity items
  const commentItems = useMemo((): CommentActivityItem[] => {
    if (!commentsQuery.data?.comments) return [];

    const flattenComments = (comment: Comment): Comment[] => {
      return [comment, ...comment.replies.flatMap(flattenComments)];
    };

    const allComments = commentsQuery.data.comments.flatMap(flattenComments);

    return allComments.map((comment) => ({
      itemType: 'comment' as const,
      id: `comment-${comment.id}`,
      timestamp: comment.created_at,
      entityType,
      entityId,
      author: {
        name: comment.author.name,
        email: comment.author.email,
        icon: comment.author.icon,
      },
      content: comment.content,
      mentions: comment.mentions,
    }));
  }, [commentsQuery.data?.comments, entityType, entityId]);

  // Transform history to activity items
  const historyItems = useMemo((): HistoryActivityItem[] => {
    if (!historyQuery.data?.data?.history) return [];

    return historyQuery.data.data.history.map((entry: any) => ({
      itemType: 'history' as const,
      id: `history-${entry.timestamp}-${entry.entity_id}`,
      timestamp: entry.timestamp,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      entityName: entry.entity_name,
      actor: entry.user,
      action: entry.action as 'create' | 'update' | 'delete' | 'autofill',
      details: entry.details,
    }));
  }, [historyQuery.data]);

  // Merge and sort by timestamp (descending)
  const feedItems = useMemo((): ActivityFeedItem[] => {
    const merged = [...commentItems, ...historyItems];
    return merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [commentItems, historyItems]);

  // Combined loading and error states
  const isLoading = commentsQuery.isLoading || historyQuery.isLoading;
  const isError = commentsQuery.isError && historyQuery.isError; // Both failed
  const hasPartialError = commentsQuery.isError || historyQuery.isError; // One failed

  return {
    feedItems,
    isLoading,
    isError,
    hasPartialError,
    commentsError: commentsQuery.error,
    historyError: historyQuery.error,
    refetch: () => {
      commentsQuery.refetch();
      historyQuery.refetch();
    },
  };
}
