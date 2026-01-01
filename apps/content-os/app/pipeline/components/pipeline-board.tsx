"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  PipelineTask,
  PipelineStatus,
  PIPELINE_STATUS_ORDER,
} from "@/lib/types/task";
import { PipelineColumn } from "./pipeline-column";
import { PipelineCard } from "./pipeline-card";
import { TaskDetailModal } from "./task-detail-modal";
import { dummyTasks } from "../data/dummy-tasks";

export function PipelineBoard() {
  const [tasks, setTasks] = useState<PipelineTask[]>(dummyTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<PipelineTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Pointer sensor with activation constraint (Codex recommendation)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<PipelineStatus, PipelineTask[]> = {
      draft: [],
      approved: [],
      in_progress: [],
      published: [],
      reviewed: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  // Get active task for drag overlay
  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId) || null,
    [tasks, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if over a column
    if (overId.startsWith("column-")) {
      const newStatus = overId.replace("column-", "") as PipelineStatus;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: newStatus } : task
        )
      );
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    // Guard for invalid drop (Codex recommendation)
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropped on a column
    if (overId.startsWith("column-")) {
      const newStatus = overId.replace("column-", "") as PipelineStatus;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: newStatus } : task
        )
      );
    }
    // If dropped on another task, place it in the same column
    else {
      const targetTask = tasks.find((t) => t.id === overId);
      if (targetTask) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === activeId
              ? { ...task, status: targetTask.status }
              : task
          )
        );
      }
    }
  }, [tasks]);

  const handleCardClick = useCallback((task: PipelineTask) => {
    setSelectedTask(task);
    setModalOpen(true);
  }, []);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 px-1">
          {PIPELINE_STATUS_ORDER.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {/* Drag Overlay for smooth dragging */}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <PipelineCard
                task={activeTask}
                onClick={() => {}}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
