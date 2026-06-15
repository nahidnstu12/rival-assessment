"use client";

import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useAccess } from "@/hooks/useAccess";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TaskFormValues } from "@/schemas/task.schema";
import type { Task } from "@/types/task";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { SortableTaskList } from "./SortableTaskList";
import { TaskSheet } from "./TaskSheet";
import { TaskRow } from "./TaskRow";
import { TaskSkeleton } from "./TaskSkeleton";
import { Toolbar } from "./Toolbar";

type TaskViewProps = {
  scope: "mine" | "all";
};

export function TaskView({ scope }: TaskViewProps) {
  const { user } = useAuth();
  const { canFetchAdminTasks } = useAccess();
  const router = useRouter();
  const defaultSort = scope === "all" ? "createdAt" : "manual";
  const { search, status, sort, page, setParam, clearFilters, setSort } = useTaskFilters(defaultSort);

  useEffect(() => {
    if (scope === "all" && !canFetchAdminTasks) router.replace("/tasks");
  }, [scope, canFetchAdminTasks, router]);

  const { data, isLoading, isFetching, isError, refetch, queryKey, params } = useTasks(scope);
  const { create, update, remove, toggleComplete, reorderTasks } = useTaskMutations();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => {
    if (localSearch === search) return;
    const t = setTimeout(() => setParam("search", localSearch || null), 220);
    return () => clearTimeout(t);
  }, [localSearch, search, setParam]);

  const mineOnly = scope === "mine";

  const counts = data?.counts ?? { all: 0, todo: 0, in_progress: 0, done: 0 };

  const title = scope === "all" ? "All tasks" : "My tasks";
  const subtitle =
    scope === "all"
      ? `${data?.total ?? 0} tasks · all users`
      : `${data?.total ?? 0} tasks · ${user?.email ?? ""}`;

  function handleSubmit(values: TaskFormValues) {
    if (editTask) {
      update.mutate({ id: editTask.id, data: values });
    } else {
      create.mutate(values);
    }
    setSheetOpen(false);
    setEditTask(null);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setSheetOpen(true);
  }

  function handleDelete(task: Task) {
    if (confirm(`Delete "${task.title}"? This can't be undone.`)) {
      remove.mutate(task.id);
    }
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
          setSheetOpen(true);
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
          onCreate={mineOnly ? () => setSheetOpen(true) : undefined}
        />
      )}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          {mineOnly ? (
            <SortableTaskList
              tasks={data.data}
              onReorder={(reordered) => {
                reorderTasks(reordered, data.data, queryKey, params, {
                  switchToManual: sort !== "manual",
                  setSort,
                });
              }}
              onToggle={(task) => toggleComplete.mutate(task)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="task-list">
              {data.data.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showOwner={scope === "all"}
                  onToggle={() => toggleComplete.mutate(task)}
                  onEdit={() => openEdit(task)}
                  onDelete={() => handleDelete(task)}
                />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            total={data.total}
            limit={data.limit}
            onChange={(p) => setParam("page", String(p))}
          />
        </>
      )}

      <TaskSheet
        open={sheetOpen}
        task={editTask}
        loading={create.isPending || update.isPending}
        onClose={() => {
          setSheetOpen(false);
          setEditTask(null);
        }}
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
