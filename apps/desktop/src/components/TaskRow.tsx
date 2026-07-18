import type { TimelineTask } from "@mission-control/core";

const statusStyles: Record<TimelineTask["status"], { bar: string; tint: string; label: string }> = {
  running: {
    bar: "bg-violet-500/55",
    tint: "bg-violet-500/[0.07] hover:bg-violet-500/[0.12]",
    label: "in progress",
  },
  waiting: {
    bar: "bg-amber-600/55",
    tint: "bg-amber-500/[0.08] hover:bg-amber-500/[0.13]",
    label: "waiting",
  },
  completed: {
    bar: "bg-emerald-600/50",
    tint: "bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12]",
    label: "done",
  },
  failed: {
    bar: "bg-rose-500/55",
    tint: "bg-rose-500/[0.07] hover:bg-rose-500/[0.12]",
    label: "failed",
  },
  cancelled: {
    bar: "bg-stone-400/60",
    tint: "bg-stone-500/[0.07] hover:bg-stone-500/[0.11]",
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
      <span className="absolute right-2 top-1.5 font-sans text-[10px] tabular-nums text-[var(--mc-muted)]/75">
        {formatCornerTime(task.updatedAt)}
      </span>
      <span className="block pr-10 text-[13px] font-medium leading-snug text-[var(--mc-text)]">
        {task.title}
      </span>
      <span className="mt-0.5 block font-sans text-[11px] capitalize tracking-wide text-[var(--mc-muted)]">
        {task.source} · {style.label}
      </span>
    </button>
  );
}
