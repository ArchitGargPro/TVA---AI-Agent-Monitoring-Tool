import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { DemoAdapter } from "@mission-control/adapters";
import { TaskCard } from "./TaskCard";
import { useTimelineTasks } from "../hooks/useTimelineTasks";
import { useMissionControl } from "../engine/MissionControlContext";
import { useSettings } from "../hooks/useSettings";

export function TimelinePanel() {
  const { visible } = useTimelineTasks();
  const { adapters } = useMissionControl();
  const { settings } = useSettings();
  const [error, setError] = useState<string | null>(null);

  async function withAdapter(
    taskId: string,
    action: (adapter: NonNullable<ReturnType<typeof adapters.get>>) => Promise<void>,
  ) {
    setError(null);
    const cursor = adapters.get("cursor");
    const demo = adapters.get("demo");
    const target = taskId.startsWith("cursor:")
      ? cursor
      : taskId.startsWith("demo")
        ? demo
        : (cursor ?? demo ?? adapters.list()[0]);

    if (!target) {
      setError("No adapter available for this task");
      return;
    }

    try {
      await action(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="flex flex-col gap-2" aria-label="Timeline">
      {error ? (
        <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <AnimatePresence initial={false}>
        {visible.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-1 py-6 text-center text-sm text-[var(--mc-muted)]"
          >
            Watching live Cursor agents. Start or continue a Cursor chat to see it here.
          </motion.p>
        ) : (
          visible.map((task) => (
            <motion.div
              key={task.taskId}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <TaskCard
                task={task}
                onSend={(taskId, message) => {
                  void withAdapter(taskId, (adapter) => adapter.sendMessage(taskId, message));
                }}
                onQueue={(taskId, message) => {
                  void withAdapter(taskId, (adapter) => adapter.queueMessage(taskId, message));
                }}
                onStop={(taskId) => {
                  void withAdapter(taskId, (adapter) => adapter.stopTask(taskId));
                }}
                onOpen={(taskId) => {
                  void withAdapter(taskId, (adapter) => adapter.openConversation(taskId));
                }}
              />
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <div className="flex gap-2 border-t border-[var(--mc-border)] pt-2">
        <button
          type="button"
          className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          onClick={() => {
            setError(null);
            const cursor = adapters.get("cursor") as { refresh?: () => Promise<void> } | undefined;
            void cursor?.refresh?.().catch((err: unknown) => {
              setError(err instanceof Error ? err.message : String(err));
            });
          }}
        >
          Refresh Cursor
        </button>
      </div>

      {settings.enableDemoAdapter ? <DemoControls onError={setError} /> : null}
    </section>
  );
}

function DemoControls({ onError }: { onError: (message: string | null) => void }) {
  const { adapters, demo } = useMissionControl();
  const demoAdapter = (adapters.get("demo") as DemoAdapter | undefined) ?? demo;

  return (
    <button
      type="button"
      className="w-full rounded-md border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2 text-xs font-medium text-[var(--mc-text)] hover:opacity-90"
      onClick={() => {
        onError(null);
        void demoAdapter.runScenario().catch((err: unknown) => {
          onError(err instanceof Error ? err.message : String(err));
        });
      }}
    >
      Run demo scenario
    </button>
  );
}
