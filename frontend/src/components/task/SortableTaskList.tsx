"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task";
import { useEffect, useRef, useState } from "react";
import { TaskRow, type TaskRowProps } from "./TaskRow";

type SortableTaskRowProps = Omit<
  TaskRowProps,
  | "dragHandleRef"
  | "dragHandleListeners"
  | "sortableAttributes"
  | "isSortableDragging"
  | "isDragOverlay"
  | "style"
  | "dragEnabled"
>;

function SortableTaskRow(props: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  return (
    <TaskRow
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
      }}
      dragEnabled
      sortableAttributes={attributes}
      dragHandleRef={setActivatorNodeRef}
      dragHandleListeners={listeners}
      isSortableDragging={isDragging}
      {...props}
    />
  );
}

type SortableTaskListProps = {
  tasks: Task[];
  showOwner?: boolean;
  onReorder: (tasks: Task[]) => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function SortableTaskList({
  tasks,
  showOwner,
  onReorder,
  onToggle,
  onEdit,
  onDelete,
}: SortableTaskListProps) {
  const [items, setItems] = useState(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setItems(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    draggingRef.current = true;
    setActiveTask(items.find((t) => t.id === active.id) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    draggingRef.current = false;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder(reordered);
  }

  function handleDragCancel() {
    draggingRef.current = false;
    setActiveTask(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {items.map((task) => (
            <SortableTaskRow
              key={task.id}
              task={task}
              showOwner={showOwner}
              onToggle={() => onToggle(task)}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeTask ? (
          <TaskRow
            task={activeTask}
            dragEnabled
            showOwner={showOwner}
            isDragOverlay
            onToggle={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
