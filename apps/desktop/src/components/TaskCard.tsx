import { useState } from "react";
import type { TimelineTask } from "@mission-control/core";
import { Button } from "@mission-control/ui";
import { useElapsedLabel } from "../hooks/useElapsedLabel";

interface TaskCardProps {
  task: TimelineTask;
  onSend: (taskId: string, message: string) => void;
  onQueue: (taskId: string, message: string) => void;
  onStop: (taskId: string) => void;
  onOpen: (taskId: string) => void;
}

export function TaskCard({ task, onSend, onQueue, onStop, onOpen }: TaskCardProps) {
  const elapsed = useElapsedLabel(
    task.startedAt,
    task.status === "running" || task.status === "waiting",
  );
  const [draft, setDraft] = useState("");
  const isLiveCursor = task.taskId.startsWith("cursor:");

  const statusColor =
    task.status === "waiting"
      ? "text-amber-600"
      : task.status === "failed"
        ? "text-red-500"
        : task.status === "completed"
          ? "text-emerald-600"
          : "text-[var(--mc-muted)]";

  return (
    <article className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-3 shadow-sm backdrop-blur">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--mc-text)]">{task.title}</h3>
          <p className={`text-xs capitalize ${statusColor}`}>
            {task.status}
            {task.waitingReason ? ` · ${task.waitingReason}` : null}
            {task.error ? ` · ${task.error}` : null}
          </p>
        </div>
        <div className="text-right text-xs text-[var(--mc-muted)]">
          <div>{task.source}</div>
          <div className="font-mono">{elapsed}</div>
        </div>
      </header>

      {task.activity ? (
        <p className="mb-2 text-xs text-[var(--mc-muted)]">{task.activity}</p>
      ) : null}

      {!isLiveCursor && (task.status === "running" || task.status === "waiting") ? (
        <div className="mb-2 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message…"
            className="min-w-0 flex-1 rounded-md border border-[var(--mc-border)] bg-transparent px-2 py-1.5 text-xs text-[var(--mc-text)] outline-none focus:border-[var(--mc-focus)]"
            aria-label={`Message for ${task.title}`}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {!isLiveCursor && (task.status === "running" || task.status === "waiting") ? (
          <>
            <Button
              className="!bg-zinc-800 !px-2 !py-1 !text-xs"
              onClick={() => {
                if (!draft.trim()) {
                  return;
                }
                onSend(task.taskId, draft.trim());
                setDraft("");
              }}
            >
              Send
            </Button>
            <Button
              className="!bg-zinc-600 !px-2 !py-1 !text-xs"
              onClick={() => {
                if (!draft.trim()) {
                  return;
                }
                onQueue(task.taskId, draft.trim());
                setDraft("");
              }}
            >
              Queue
            </Button>
            <Button
              className="!bg-red-700 !px-2 !py-1 !text-xs"
              onClick={() => onStop(task.taskId)}
            >
              Stop
            </Button>
          </>
        ) : null}
        <Button className="!bg-zinc-700 !px-2 !py-1 !text-xs" onClick={() => onOpen(task.taskId)}>
          Open in Cursor
        </Button>
      </div>
    </article>
  );
}
