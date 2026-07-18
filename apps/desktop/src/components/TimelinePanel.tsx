import { AnimatePresence, motion } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { useTimelineTasks } from "../hooks/useTimelineTasks";
import { useMissionControl } from "../engine/MissionControlContext";
import type { DemoAdapter } from "@mission-control/adapters";

export function TimelinePanel() {
  const { visible } = useTimelineTasks();
  const { adapters } = useMissionControl();

  async function withAdapter(
    taskId: string,
    action: (adapter: NonNullable<ReturnType<typeof adapters.get>>) => Promise<void>,
  ) {
    const demo = adapters.get("demo");
    const cursor = adapters.get("cursor");
    const target =
      taskId.startsWith("demo") && demo ? demo : (demo ?? cursor ?? adapters.list()[0]);
    if (!target) {
      return;
    }
    await action(target);
  }

  return (
    <section
      className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1"
      aria-label="Timeline"
    >
      <AnimatePresence initial={false}>
        {visible.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-1 py-6 text-center text-sm text-zinc-500"
          >
            No active tasks. Run the demo to verify the flow.
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

      <DemoControls />
    </section>
  );
}

function DemoControls() {
  const { adapters, demo } = useMissionControl();
  const demoAdapter = (adapters.get("demo") as DemoAdapter | undefined) ?? demo;

  return (
    <div className="sticky bottom-0 flex gap-2 border-t border-zinc-200/70 bg-[#f4f4f5]/95 py-2 backdrop-blur">
      <button
        type="button"
        className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:opacity-90"
        onClick={() => {
          void demoAdapter.runScenario();
        }}
      >
        Run demo scenario
      </button>
    </div>
  );
}
