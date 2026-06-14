import type { Metadata } from "next";
import { TaskView } from "@/components/task/TaskView";

export const metadata: Metadata = {
  title: "All tasks",
};

export default function AllTasksPage() {
  return <TaskView scope="all" />;
}
