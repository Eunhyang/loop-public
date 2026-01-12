import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from './api';
import type { CreateTaskDTO } from './api';
import { queryKeys } from '@/queries/keys';
import type { Task, AttachmentListResponse } from '@/types';

export const useTasks = (filters?: { status?: string; assignee?: string }) => {
    return useQuery({
        queryKey: queryKeys.tasks(filters),
        queryFn: () => taskApi.getTasks(filters).then(res => res.data),
    });
};

export const useTask = (id: string | null) => {
    return useQuery({
        queryKey: id ? queryKeys.task(id) : [],
        queryFn: () => taskApi.getTask(id!).then(res => res.data),
        enabled: !!id,
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
            taskApi.updateTask(id, data).then(res => res.data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot previous value
            const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic update for single task
            if (previousTask) {
                queryClient.setQueryData<Task>(queryKeys.task(id), {
                    ...previousTask,
                    ...data,
                });
            }

            // Optimistic update for dashboardInit (Kanban Board)
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    tasks: previousDashboard.tasks.map((t: Task) =>
                        t.entity_id === id ? { ...t, ...data } : t
                    ),
                });
            }

            return { previousTask, previousDashboard };
        },
        onError: (_err, newTodo, context) => {
            // Rollback
            if (context?.previousTask) {
                queryClient.setQueryData(queryKeys.task(newTodo.id), context.previousTask);
            }
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: (_data, _error, variables) => {
            // Refetch / Invalidate
            queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskDTO) => taskApi.createTask(data),
        onSuccess: () => {
            // Invalidate Dashboard Init (for global state refresh)
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });

            // Invalidate ALL task queries (including filtered ones)
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.deleteTask(id),
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
            await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
            await queryClient.cancelQueries({ queryKey: queryKeys.dashboardInit });

            // Snapshot for rollback
            const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));
            const previousDashboard = queryClient.getQueryData<any>(queryKeys.dashboardInit);

            // Optimistic removal from dashboardInit
            if (previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, {
                    ...previousDashboard,
                    tasks: previousDashboard.tasks.filter((t: Task) => t.entity_id !== id),
                });
            }

            return { previousTask, previousDashboard };
        },
        onError: (_err, _id, context) => {
            // Rollback on error
            if (context?.previousDashboard) {
                queryClient.setQueryData(queryKeys.dashboardInit, context.previousDashboard);
            }
        },
        onSettled: () => {
            // Invalidate all task-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
        },
    });
};

export const useDuplicateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => taskApi.duplicateTask(id),
        onSuccess: (response) => {
            // Extract new task data from response
            const newTask = response.data.task;
            const newTaskId = response.data.task_id;

            // Proactive cache population - prevents "Loading..." state
            if (newTask) {
                // 1. Set individual task cache (enables immediate drawer render)
                queryClient.setQueryData(queryKeys.task(newTaskId), newTask);

                // 2. Update dashboardInit tasks array (updates Kanban board)
                const dashboardData = queryClient.getQueryData<any>(queryKeys.dashboardInit);
                if (dashboardData) {
                    queryClient.setQueryData(queryKeys.dashboardInit, {
                        ...dashboardData,
                        tasks: [...dashboardData.tasks, newTask],
                    });
                }
            }

            // 3. Invalidate filtered task queries (refetch in background)
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
};

// Attachment hooks
export const useAttachments = (taskId: string | null) => {
    return useQuery({
        queryKey: taskId ? queryKeys.attachments(taskId) : [],
        queryFn: () => taskApi.getAttachments(taskId!),
        enabled: !!taskId,
    });
};

export const useUploadAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, file, onProgress }: {
            taskId: string;
            file: File;
            onProgress?: (progress: number) => void;
        }) => taskApi.uploadAttachment(taskId, file, onProgress),
        onSuccess: (_, { taskId }) => {
            // Invalidate attachments query to refetch the list
            queryClient.invalidateQueries({ queryKey: queryKeys.attachments(taskId) });
        },
    });
};

export const useDeleteAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, filename }: { taskId: string; filename: string }) =>
            taskApi.deleteAttachment(taskId, filename),
        onMutate: async ({ taskId, filename }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.attachments(taskId) });

            // Snapshot previous value
            const previousAttachments = queryClient.getQueryData<AttachmentListResponse>(queryKeys.attachments(taskId));

            // Optimistic update - remove the attachment
            if (previousAttachments) {
                queryClient.setQueryData<AttachmentListResponse>(queryKeys.attachments(taskId), {
                    ...previousAttachments,
                    attachments: previousAttachments.attachments.filter(a => a.filename !== filename),
                    total_count: previousAttachments.total_count - 1,
                    total_size: previousAttachments.total_size - (previousAttachments.attachments.find(a => a.filename === filename)?.size || 0),
                });
            }

            return { previousAttachments };
        },
        onError: (_err, { taskId }, context) => {
            // Rollback on error
            if (context?.previousAttachments) {
                queryClient.setQueryData(queryKeys.attachments(taskId), context.previousAttachments);
            }
        },
        onSettled: (_, __, { taskId }) => {
            // Invalidate to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.attachments(taskId) });
        },
    });
};

export const useParseTaskNL = () => {
    return useMutation({
        mutationFn: (text: string) => taskApi.parseNaturalLanguage(text),
    });
};

// Link Preview hook
export const useLinkPreview = (url: string | null) => {
    return useQuery({
        queryKey: queryKeys.linkPreview(url),
        queryFn: () => taskApi.getLinkPreview(url!),
        enabled: !!url && url.startsWith('http'),
        staleTime: 60 * 60 * 1000, // 1 hour client-side cache
        retry: 1, // Only retry once on failure
    });
};
