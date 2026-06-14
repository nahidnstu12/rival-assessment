"use client";

import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import type { TaskFormValues } from "@/schemas/task.schema";
import type { Task } from "@/types/task";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { TaskModal } from "./TaskModal";
import { TaskRow } from "./TaskRow";
import { TaskSkeleton } from "./TaskSkeleton";
import { Toolbar } from "./Toolbar";

type TaskViewProps = {
  scope: "mine" | "all";
};

export function TaskView({ scope }: TaskViewProps) {
  const { user } = useAuth();
  const defaultSort = scope === "all" ? "createdAt" : "manual";
  const { search, status, sort, page, setParam, clearFilters } = useTaskFilters(defaultSort);
  const { data, isLoading, isFetching, isError, refetch } = useTasks(scope);
  const { create, update, remove, toggleComplete, reorder } = useTaskMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [localSearch, setLocalSearch] = useState(search);
  const dragSrc = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; below: boolean } | null>(null);

  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => {
    if (localSearch === search) return;
    const t = setTimeout(() => setParam("search", localSearch || null), 220);
    return () => clearTimeout(t);
  }, [localSearch, search, setParam]);

  const mineOnly = scope === "mine";
  const dragEnabled = mineOnly && sort === "manual";

  const counts = data?.counts ?? { all: 0, todo: 0, in_progress: 0, done: 0 };

  const title = scope === "all" ? "All tasks" : "My tasks";
  const subtitle =
    scope === "all"
      ? `${data?.total ?? 0} tasks · all users`
      : `${data?.total ?? 0} tasks · ${user?.email ?? ""}`;

  async function handleSubmit(values: TaskFormValues) {
    if (editTask) {
      await update.mutateAsync({ id: editTask.id, data: values });
    } else {
      await create.mutateAsync(values);
    }
    setModalOpen(false);
    setEditTask(null);
  }

  function handleDrop(targetId: string, below: boolean) {
    const srcId = dragSrc.current;
    if (!srcId || srcId === targetId || !data) return;
    const items = [...data.data];
    const srcIdx = items.findIndex((t) => t.id === srcId);
    if (srcIdx < 0 || items.findIndex((t) => t.id === targetId) < 0) return;
    const [src] = items.splice(srcIdx, 1);
    let idx = items.findIndex((t) => t.id === targetId);
    if (below) idx += 1;
    items.splice(idx, 0, src);
    items.forEach((t, i) => reorder.mutate({ id: t.id, order: i }));
    dragSrc.current = null;
    setDropTarget(null);
  }

  return (
    <AppShell
      topbar={{
        title,
        subtitle,
        showSearch: true,
        showNewTask: mineOnly,
        search: localSearch,
        onSearchChange: setLocalSearch,
        onNewTask: () => {
          setEditTask(null);
          setModalOpen(true);
        },
      }}
    >
      <Toolbar counts={counts} mineOnly={mineOnly} sortDisabled={isFetching} defaultSort={defaultSort} />

      {isLoading && <TaskSkeleton />}
      {isError && (
        <div className="empty">
          <p className="text-[var(--red)] mb-3">Failed to load tasks</p>
          <button type="button" className="btn btn-ghost" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}
      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          filtered={!!search || status !== "all"}
          onClear={clearFilters}
          onCreate={mineOnly ? () => setModalOpen(true) : undefined}
        />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="task-list">
            {data.data.map((task) => {
              const dc =
                dropTarget?.id === task.id
                  ? dropTarget.below
                    ? "drop-below"
                    : "drop-above"
                  : dragSrc.current === task.id
                    ? "dragging"
                    : "";
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  dragEnabled={dragEnabled}
                  showOwner={scope === "all"}
                  dragClass={dc}
                  onToggle={() => toggleComplete.mutate(task)}
                  onEdit={() => {
                    setEditTask(task);
                    setModalOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm(`Delete "${task.title}"? This can't be undone.`)) {
                      remove.mutate(task.id);
                    }
                  }}
                  onDragStart={(id) => {
                    dragSrc.current = id;
                  }}
                  onDragEnd={() => {
                    dragSrc.current = null;
                    setDropTarget(null);
                  }}
                  onDragOver={(e, id) => {
                    e.preventDefault();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setDropTarget({ id, below: (e.clientY - r.top) / r.height > 0.5 });
                  }}
                  onDrop={(e, id) => {
                    e.preventDefault();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    handleDrop(id, (e.clientY - r.top) / r.height > 0.5);
                  }}
                />
              );
            })}
          </div>
          <Pagination
            page={page}
            total={data.total}
            limit={data.limit}
            onChange={(p) => setParam("page", String(p))}
          />
        </>
      )}

      <TaskModal
        open={modalOpen}
        task={editTask}
        loading={create.isPending || update.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditTask(null);
        }}
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
