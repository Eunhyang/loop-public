import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useNavigate } from 'react-router-dom';
import { useUi } from '@/contexts/UiContext';

// Discriminated union types for type-safe selection
export type CommandItem = {
  type: 'command';
  id: string;
  icon: string;
  title: string;
  description: string;
  action: () => void;
};

export type EntityItem = {
  type: 'task' | 'project' | 'program' | 'track' | 'condition' | 'hypothesis';
  id: string;
  icon: string;
  title: string;
  meta: string;
  badge?: string;
  data: any;
};

export type SearchItem = CommandItem | EntityItem;

export function useCommandSearch() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data } = useDashboardInit();
  const navigate = useNavigate();
  const { openEntityDrawer, closeCommandPalette } = useUi();

  // Available commands (> prefix)
  const commands: CommandItem[] = useMemo(() => [
    {
      type: 'command' as const,
      id: 'new-task',
      icon: '➕',
      title: 'New Task',
      description: 'Create a new task',
      action: () => {
        closeCommandPalette();
        openEntityDrawer({ type: 'task', mode: 'create' });
      },
    },
    {
      type: 'command' as const,
      id: 'new-project',
      icon: '📁',
      title: 'New Project',
      description: 'Create a new project',
      action: () => {
        closeCommandPalette();
        openEntityDrawer({ type: 'project', mode: 'create' });
      },
    },
    {
      type: 'command' as const,
      id: 'view-kanban',
      icon: '📋',
      title: 'View Kanban',
      description: 'Switch to Kanban view',
      action: () => {
        closeCommandPalette();
        navigate('/kanban');
      },
    },
    {
      type: 'command' as const,
      id: 'view-calendar',
      icon: '📅',
      title: 'View Calendar',
      description: 'Switch to Calendar view',
      action: () => {
        closeCommandPalette();
        navigate('/calendar');
      },
    },
    {
      type: 'command' as const,
      id: 'view-graph',
      icon: '🔗',
      title: 'View Graph',
      description: 'Switch to Graph view',
      action: () => {
        closeCommandPalette();
        navigate('/graph');
      },
    },
    {
      type: 'command' as const,
      id: 'view-pending',
      icon: '⏳',
      title: 'View Pending',
      description: 'Switch to Pending Reviews',
      action: () => {
        closeCommandPalette();
        navigate('/pending');
      },
    },
  ], [navigate, openEntityDrawer, closeCommandPalette]);

  // Search results (memoized for performance)
  const results: SearchItem[] = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    // Command mode (> prefix)
    if (trimmedQuery.startsWith('>')) {
      const cmdQuery = trimmedQuery.slice(1).trim();
      if (!cmdQuery) return commands; // Show all commands if just ">"

      return commands.filter(cmd =>
        cmd.title.toLowerCase().includes(cmdQuery) ||
        cmd.description.toLowerCase().includes(cmdQuery)
      );
    }

    // Empty query - return empty (could show recent items in future)
    if (trimmedQuery.length === 0) {
      return [];
    }

    // Entity search
    const items: SearchItem[] = [];

    // Search Tasks (max 5)
    if (data?.tasks) {
      const tasks = data.tasks
        .filter(t =>
          t.entity_name?.toLowerCase().includes(trimmedQuery) ||
          t.entity_id?.toLowerCase().includes(trimmedQuery) ||
          t.assignee?.toLowerCase().includes(trimmedQuery) ||
          t.status?.toLowerCase().includes(trimmedQuery) ||
          t.priority?.toLowerCase().includes(trimmedQuery) ||
          t.project_id?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 5)
        .map((t): EntityItem => ({
          type: 'task',
          id: t.entity_id,
          icon: '📋',
          title: t.entity_name || 'Untitled Task',
          meta: `${t.entity_id} · ${t.assignee || 'unassigned'}`,
          badge: t.status,
          data: t,
        }));
      items.push(...tasks);
    }

    // Search Projects (max 5)
    if (data?.projects) {
      const projects = data.projects
        .filter(p =>
          p.entity_name?.toLowerCase().includes(trimmedQuery) ||
          p.entity_id?.toLowerCase().includes(trimmedQuery) ||
          p.owner?.toLowerCase().includes(trimmedQuery) ||
          p.status?.toLowerCase().includes(trimmedQuery) ||
          p.program_id?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 5)
        .map((p): EntityItem => ({
          type: 'project',
          id: p.entity_id,
          icon: '📁',
          title: p.entity_name || 'Untitled Project',
          meta: `${p.entity_id} · ${p.owner || ''}`,
          badge: p.status,
          data: p,
        }));
      items.push(...projects);
    }

    // Search Programs (max 3)
    if (data?.programs) {
      const programs = data.programs
        .filter(p =>
          p.entity_name?.toLowerCase().includes(trimmedQuery) ||
          p.entity_id?.toLowerCase().includes(trimmedQuery) ||
          p.status?.toLowerCase().includes(trimmedQuery) ||
          p.owner?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 3)
        .map((p): EntityItem => ({
          type: 'program',
          id: p.entity_id,
          icon: '📦',
          title: p.entity_name || 'Untitled Program',
          meta: p.entity_id,
          badge: p.status,
          data: p,
        }));
      items.push(...programs);
    }

    // Search Tracks (max 3)
    if (data?.tracks) {
      const tracks = data.tracks
        .filter(t =>
          t.entity_name?.toLowerCase().includes(trimmedQuery) ||
          t.entity_id?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 3)
        .map((t): EntityItem => ({
          type: 'track',
          id: t.entity_id,
          icon: '📊',
          title: t.entity_name || 'Untitled Track',
          meta: t.entity_id,
          data: t,
        }));
      items.push(...tracks);
    }

    // Search Conditions (max 3)
    if (data?.conditions) {
      const conditions = data.conditions
        .filter(c =>
          c.entity_name?.toLowerCase().includes(trimmedQuery) ||
          c.entity_id?.toLowerCase().includes(trimmedQuery) ||
          c.status?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 3)
        .map((c): EntityItem => ({
          type: 'condition',
          id: c.entity_id,
          icon: '⚠️',
          title: c.entity_name || 'Untitled Condition',
          meta: c.entity_id,
          badge: c.status,
          data: c,
        }));
      items.push(...conditions);
    }

    // Search Hypotheses (max 3)
    if (data?.hypotheses) {
      const hypotheses = data.hypotheses
        .filter(h =>
          h.entity_name?.toLowerCase().includes(trimmedQuery) ||
          h.entity_id?.toLowerCase().includes(trimmedQuery) ||
          h.status?.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 3)
        .map((h): EntityItem => ({
          type: 'hypothesis',
          id: h.entity_id,
          icon: '💡',
          title: h.entity_name || 'Untitled Hypothesis',
          meta: h.entity_id,
          badge: h.status,
          data: h,
        }));
      items.push(...hypotheses);
    }

    return items;
  }, [query, data, commands]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  // Keyboard navigation
  const moveSelection = useCallback((delta: number) => {
    if (results.length === 0) return;

    setSelectedIndex(prev => {
      let next = prev + delta;
      // Wrap around
      if (next < 0) next = results.length - 1;
      if (next >= results.length) next = 0;
      return next;
    });
  }, [results.length]);

  // Select item
  const selectItem = useCallback((index: number) => {
    const item = results[index];
    if (!item) return;

    if (item.type === 'command') {
      // Execute command action
      item.action();
    } else {
      // Handle entity selection
      closeCommandPalette();

      switch (item.type) {
        case 'task':
        case 'project':
          openEntityDrawer({ type: item.type, mode: 'edit', id: item.id });
          break;
        case 'program':
          // Open drawer for program editing
          openEntityDrawer({ type: 'program', mode: 'edit', id: item.id });
          break;
        case 'track':
        case 'condition':
        case 'hypothesis':
          // Navigate with filter (read-only entities)
          navigate(`/kanban?${item.type}=${item.id}`);
          break;
      }
    }
  }, [results, navigate, openEntityDrawer, closeCommandPalette]);

  return {
    query,
    setQuery,
    results,
    selectedIndex,
    moveSelection,
    selectItem,
  };
}
