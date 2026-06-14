"use client";

type PaginationProps = {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
      <div className="text-[12.5px] text-[var(--text-muted)]">
        Showing <b className="mono text-[var(--text)]">{start}–{end}</b> of{" "}
        <b className="mono text-[var(--text)]">{total}</b>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn btn-ghost btn-sm min-w-8 h-8 p-0"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ‹
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            className={`btn btn-sm min-w-8 h-8 p-0 ${p === page ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-sm min-w-8 h-8 p-0"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
