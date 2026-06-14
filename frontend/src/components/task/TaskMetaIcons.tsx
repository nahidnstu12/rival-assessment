import type { TaskPriority, TaskStatus } from "@/types/task";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react";

type MetaItem<T extends string> = {
  value: T;
  icon: LucideIcon;
  label: string;
  tone: string;
};

export const STATUS_OPTIONS: MetaItem<TaskStatus>[] = [
  { value: "TODO", icon: CircleDashed, label: "To do", tone: "meta-todo" },
  { value: "IN_PROGRESS", icon: Clock, label: "In progress", tone: "meta-in_progress" },
  { value: "DONE", icon: CheckCircle2, label: "Done", tone: "meta-done" },
];

export const PRIORITY_OPTIONS: MetaItem<TaskPriority>[] = [
  { value: "LOW", icon: SignalLow, label: "Low", tone: "meta-low" },
  { value: "MEDIUM", icon: SignalMedium, label: "Medium", tone: "meta-medium" },
  { value: "HIGH", icon: SignalHigh, label: "High", tone: "meta-high" },
];

function metaFor<T extends string>(options: MetaItem<T>[], value: T) {
  return options.find((o) => o.value === value) ?? options[0];
}

export function StatusIcon({
  status,
  size = 14,
  showLabel,
}: {
  status: TaskStatus;
  size?: number;
  showLabel?: boolean;
}) {
  const meta = metaFor(STATUS_OPTIONS, status);
  const Icon = meta.icon;
  return (
    <span className={`meta-chip ${meta.tone}`} title={meta.label} aria-label={meta.label}>
      <Icon size={size} strokeWidth={2} />
      {showLabel && <span className="meta-chip-label">{meta.label}</span>}
    </span>
  );
}

export function PriorityIcon({
  priority,
  size = 14,
  showLabel,
}: {
  priority: TaskPriority;
  size?: number;
  showLabel?: boolean;
}) {
  const meta = metaFor(PRIORITY_OPTIONS, priority);
  const Icon = meta.icon;
  return (
    <span className={`meta-chip ${meta.tone}`} title={meta.label} aria-label={meta.label}>
      <Icon size={size} strokeWidth={2} />
      {showLabel && <span className="meta-chip-label">{meta.label}</span>}
    </span>
  );
}
