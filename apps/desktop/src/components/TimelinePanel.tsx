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
    <section className="flex flex-col gap-1" aria-label="Agents">
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
            className="px-1 py-8 text-center text-xs text-[var(--mc-muted)]"
          >
            No active agents
          </motion.p>
        ) : (
          visible.map((task) => (
            <motion.div
              key={task.taskId}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TaskRow task={task} onOpen={(id) => void openTask(id)} />
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </section>
  );
}
