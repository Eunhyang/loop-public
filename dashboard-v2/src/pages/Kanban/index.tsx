import { useDashboardInit } from '@/queries/useDashboardInit';

export const KanbanPage = () => {
  const { data, isLoading, error } = useDashboardInit();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dashboard</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Kanban</h1>
      <p className="text-gray-600">Loaded {data?.tasks?.length || 0} tasks</p>
    </div>
  );
};
