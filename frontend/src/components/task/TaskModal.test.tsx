import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskModal } from "@/components/task/TaskModal";

describe("TaskModal", () => {
  it('shows "Title is required" when submitted empty', async () => {
    const user = userEvent.setup();
    render(<TaskModal open onClose={vi.fn()} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
  });
});
