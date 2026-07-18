import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { TaskRow } from "./TaskRow";
import { useTimelineTasks } from "../hooks/useTimelineTasks";
import { useMissionControl } from "../engine/MissionControlContext";

function resolveAdapterId(taskId: string): string {
  if (taskId.startsWith("cursor:")) {
    return "cursor";
  }
  if (taskId.startsWith("demo")) {
    return "demo";
  }
  if (taskId.startsWith("claude:")) {
    return "claude";
  }
  if (taskId.startsWith("codex:")) {
    return "codex";
  }
  return "cursor";
}

export function TimelinePanel() {
  const { visible } = useTimelineTasks();
  const { adapters } = useMissionControl();
  const [error, setError] = useState<string | null>(null);

  async function openTask(taskId: string) {
    setError(null);
    const adapter = adapters.get(resolveAdapterId(taskId)) ?? adapters.get("cursor");
    if (!adapter) {
      setError("No IDE adapter available");
      return;
    }
    try {
      await adapter.openConversation(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section
      className="flex flex-col gap-1.5 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/90 p-2 shadow-[0_12px_28px_-18px_rgba(63,42,20,0.55)]"
      aria-label="Agents"
    >
      <header className="flex items-center justify-between px-1 pb-0.5">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mc-muted)]">
          Active agents
        </span>
        <span className="font-sans text-[10px] tabular-nums text-[var(--mc-muted)]">
          {visible.length}
        </span>
      </header>

      {error ? (
        <p className="px-1 text-[11px] text-rose-500" role="alert">
          {error}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {visible.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-1 py-8 text-center font-sans text-xs text-[var(--mc-muted)]"
          >
            Watching Cursor sessions…
          </motion.p>
        ) : (
          visible.map((task, index) => (
            <motion.div
              key={task.taskId}
              layout
              initial={{ opacity: 0, x: -12, rotate: -2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{
                type: "spring",
                stiffness: 460,
                damping: 22,
                delay: index * 0.03,
              }}
            >
              <TaskRow task={task} onOpen={(id) => void openTask(id)} />
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </section>
  );
}
