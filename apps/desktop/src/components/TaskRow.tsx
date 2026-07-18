import type { TimelineTask } from "@mission-control/core";

const statusStyles: Record<TimelineTask["status"], { bar: string; tint: string; label: string }> = {
  running: {
    bar: "bg-violet-500/70",
    tint: "bg-violet-500/[0.06] hover:bg-violet-500/[0.1]",
    label: "in progress",
  },
  waiting: {
    bar: "bg-amber-500/70",
    tint: "bg-amber-500/[0.06] hover:bg-amber-500/[0.1]",
    label: "waiting",
  },
  completed: {
    bar: "bg-emerald-500/70",
    tint: "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1]",
    label: "done",
  },
  failed: {
    bar: "bg-rose-500/70",
    tint: "bg-rose-500/[0.06] hover:bg-rose-500/[0.1]",
    label: "failed",
  },
  cancelled: {
    bar: "bg-zinc-400/70",
    tint: "bg-zinc-500/[0.06] hover:bg-zinc-500/[0.1]",
    label: "cancelled",
  },
};

function formatCornerTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

interface TaskRowProps {
  task: TimelineTask;
  onOpen: (taskId: string) => void;
}

export function TaskRow({ task, onOpen }: TaskRowProps) {
  const style = statusStyles[task.status];

  return (
    <button
      type="button"
      onClick={() => onOpen(task.taskId)}
      className={`relative w-full rounded-lg px-3 py-2.5 text-left transition-colors ${style.tint}`}
      aria-label={`Open ${task.title}`}
    >
      <span className={`absolute bottom-2 left-0 top-2 w-0.5 rounded-full ${style.bar}`} />
      <span className="absolute right-2 top-1.5 text-[10px] tabular-nums text-[var(--mc-muted)]/80">
        {formatCornerTime(task.updatedAt)}
      </span>
      <span className="block pr-10 text-[13px] font-medium leading-snug text-[var(--mc-text)]">
        {task.title}
      </span>
      <span className="mt-0.5 block text-[11px] capitalize tracking-wide text-[var(--mc-muted)]">
        {task.source} · {style.label}
      </span>
    </button>
  );
}
