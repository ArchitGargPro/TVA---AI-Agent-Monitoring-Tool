import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useMissionControl } from "../engine/MissionControlContext";
import { MissMinutes } from "./MissMinutes";
import { AgentBubble } from "./AgentBubble";
import { useTimelineTasks } from "../hooks/useTimelineTasks";

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

function tasksFingerprint(
  tasks: readonly {
    taskId: string;
    status: string;
    title: string;
    activity: string | null;
    updatedAt: number;
  }[],
): string {
  return tasks
    .map(
      (task) =>
        `${task.taskId}:${task.status}:${task.updatedAt}:${task.title}:${task.activity ?? ""}`,
    )
    .join("|");
}

export function FloatingShell() {
  const [expanded, setExpanded] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);
  const lastFingerprint = useRef<string>("");
  const hovering = useRef(false);
  const reduceMotion = useReducedMotion();
  const { visible, waiting } = useTimelineTasks();
  const { adapters } = useMissionControl();
  const attention = waiting.length > 0 && badgeCount > 0;

  function clearLeaveTimer() {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }

  function markSeen() {
    setGlowing(false);
    setBadgeCount(0);
  }

  function expandAndClear() {
    clearLeaveTimer();
    hovering.current = true;
    setExpanded(true);
    markSeen();
  }

  function collapseSoon() {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => {
      hovering.current = false;
      setExpanded(false);
    }, 240);
  }

  useEffect(() => () => clearLeaveTimer(), []);

  // Glow + badge when agent list/content changes until hover/click.
  useEffect(() => {
    const next = tasksFingerprint(visible);
    if (!lastFingerprint.current) {
      lastFingerprint.current = next;
      if (visible.length > 0 && !hovering.current) {
        setBadgeCount(visible.length);
      }
      return;
    }
    if (next !== lastFingerprint.current) {
      lastFingerprint.current = next;
      if (!hovering.current) {
        setGlowing(true);
        setBadgeCount(visible.length);
      }
    }
  }, [visible]);

  async function focusAgent(taskId: string) {
    const adapter = adapters.get(resolveAdapterId(taskId)) ?? adapters.get("cursor");
    if (!adapter) {
      return;
    }
    try {
      await adapter.openConversation(taskId);
    } catch (error) {
      console.warn("[minutecontrol] focus failed", error);
    }
  }

  function onClockPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    markSeen();
    pointerStart.current = { x: event.clientX, y: event.clientY };
    didDrag.current = false;
  }

  function onClockPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || didDrag.current) {
      return;
    }
    const moved =
      Math.abs(event.clientX - start.x) > 4 || Math.abs(event.clientY - start.y) > 4;
    if (!moved) {
      return;
    }
    didDrag.current = true;
    void getCurrentWindow().startDragging().catch(() => undefined);
  }

  function onClockPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || didDrag.current) {
      return;
    }
    const moved =
      Math.abs(event.clientX - start.x) > 4 || Math.abs(event.clientY - start.y) > 4;
    if (moved) {
      return;
    }
    markSeen();
    setExpanded((value) => !value);
  }

  return (
    <div
      className="flex h-full w-full items-end justify-end gap-2 overflow-visible p-4"
      onMouseEnter={expandAndClear}
      onMouseLeave={collapseSoon}
    >
      <AnimatePresence>
        {expanded ? (
          <motion.div
            key="bubbles"
            className="mb-2 flex max-h-[300px] w-[230px] flex-col items-end gap-1.5 overflow-y-auto"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
            transition={{ type: "spring", stiffness: 480, damping: 22 }}
          >
            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-black/10 bg-white/90 px-3 py-2 font-sans text-[11px] text-black/70 shadow backdrop-blur-sm"
              >
                Watching Cursor…
              </motion.div>
            ) : (
              visible.map((task, index) => (
                <AgentBubble
                  key={task.taskId}
                  task={task}
                  index={index}
                  onFocus={(id) => void focusAgent(id)}
                />
              ))
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div
        role="button"
        tabIndex={0}
        className="shrink-0 cursor-grab active:cursor-grabbing"
        aria-label={expanded ? "Miss Minutes (expanded)" : "Miss Minutes — drag to move"}
        aria-expanded={expanded}
        onPointerDown={onClockPointerDown}
        onPointerMove={onClockPointerMove}
        onPointerUp={onClockPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            markSeen();
            setExpanded((value) => !value);
          }
        }}
      >
        <MissMinutes attention={attention} activeCount={badgeCount} glowing={glowing} />
      </div>
    </div>
  );
}
