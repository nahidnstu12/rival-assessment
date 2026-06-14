const AVATAR_COLORS = ["#6E56CF", "#0B7FD4", "#2A9461", "#D99405", "#E5484D", "#0891B2", "#DB2777"];

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(d: string | null, status: string) {
  if (!d || status === "DONE") return false;
  const today = new Date().toISOString().slice(0, 10);
  return d < today;
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    TODO: "To do",
    IN_PROGRESS: "In progress",
    DONE: "Done",
  };
  return map[status] ?? status;
}

export function priorityLabel(p: string) {
  return p.charAt(0) + p.slice(1).toLowerCase();
}

export function roleLabel(role: string, status: string) {
  if (role === "ADMIN") return "Administrator";
  return status === "APPROVED" ? "Member" : "Pending approval";
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
