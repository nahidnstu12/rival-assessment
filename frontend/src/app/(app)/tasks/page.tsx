import type { Metadata } from "next";
import { TaskView } from "@/components/task/TaskView";

export const metadata: Metadata = {
  title: "My tasks",
};

export default function TasksPage() {
  return <TaskView scope="mine" />;
}
