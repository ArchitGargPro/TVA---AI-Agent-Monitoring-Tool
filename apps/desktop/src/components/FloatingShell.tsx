import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eraser, RefreshCw } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { useMissionControl } from "../engine/MissionControlContext";
import { MissMinutes } from "./MissMinutes";
import { AgentBubble } from "./AgentBubble";
import { useTimelineTasks } from "../hooks/useTimelineTasks";
import type { CursorAdapter } from "@mission-control/adapters";

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

const MAX_BUBBLES = 6;

export function FloatingShell() {
  const [expanded, setExpanded] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);
  const lastFingerprint = useRef<string>("");
  const hovering = useRef(false);
  const reduceMotion = useReducedMotion();
  const { visible, waiting, running } = useTimelineTasks();
  const { adapters } = useMissionControl();
  const glowMode =
    waiting.length > 0 ? "waiting" : running.length > 0 ? "processing" : "idle";
  const shownBubbles = visible.slice(0, MAX_BUBBLES);

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

  useEffect(() => {
    function closeMenu() {
      setMenu(null);
    }
    window.addEventListener("click", closeMenu);
    window.addEventListener("blur", closeMenu);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("blur", closeMenu);
    };
  }, []);

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

  async function acknowledgeTask(taskId: string) {
    const adapter = adapters.get(resolveAdapterId(taskId)) ?? adapters.get("cursor");
    if (!adapter) {
      return;
    }
    try {
      await adapter.acknowledgeTask(taskId);
    } catch (error) {
      console.warn("[minutecontrol] acknowledge failed", error);
    }
  }

  async function focusAgent(taskId: string) {
    const adapter = adapters.get(resolveAdapterId(taskId)) ?? adapters.get("cursor");
    if (!adapter) {
      return;
    }
    try {
      await adapter.openConversation(taskId);
    } catch (error) {
      console.warn("[minutecontrol] focus failed", error);
      await acknowledgeTask(taskId);
    }
  }

  async function clearAllBubbles() {
    setMenu(null);
    markSeen();
    const tasks = [...visible];
    await Promise.all(tasks.map((task) => acknowledgeTask(task.taskId)));
    setExpanded(false);
  }

  async function reloadAgents() {
    setMenu(null);
    const cursor = adapters.get("cursor") as CursorAdapter | undefined;
    if (cursor && typeof cursor.refresh === "function") {
      try {
        await cursor.refresh();
      } catch (error) {
        console.warn("[minutecontrol] reload failed", error);
      }
    } else {
      try {
        await invoke("scan_cursor_agents");
      } catch {
        // best-effort
      }
    }
    try {
      await invoke("show_fidget_window");
    } catch {
      // already visible
    }
  }

  function onClockContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ x: event.clientX, y: event.clientY });
  }

  function onClockPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    setMenu(null);
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
      className="relative flex h-full w-full items-start justify-end gap-2 overflow-visible p-3"
      onMouseEnter={expandAndClear}
      onMouseLeave={collapseSoon}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="flex flex-col items-end gap-1.5">
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
          onContextMenu={onClockContextMenu}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              markSeen();
              setExpanded((value) => !value);
            }
          }}
        >
          <MissMinutes mode={glowMode} activeCount={badgeCount} glowing={glowing} />
        </div>

        <AnimatePresence>
          {expanded ? (
            <motion.div
              key="bubbles"
              className="flex w-[230px] flex-col items-end gap-1.5 overflow-hidden"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 480, damping: 22 }}
            >
              {shownBubbles.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-black/10 bg-white/90 px-3 py-2 font-sans text-[11px] text-black/70 shadow backdrop-blur-sm"
                >
                  I'm watching
                </motion.div>
              ) : (
                shownBubbles.map((task, index) => (
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
      </div>

      {menu ? (
        <div
          className="absolute z-50 min-w-[148px] overflow-hidden rounded-lg border border-black/10 bg-white/95 py-1 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.min(menu.x, window.innerWidth - 168),
            top: Math.min(menu.y, window.innerHeight - 88),
          }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-sans text-[12px] text-black/80 hover:bg-black/5"
            onClick={() => void reloadAgents()}
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0 text-black/50" aria-hidden />
            Reload
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-sans text-[12px] text-black/80 hover:bg-black/5"
            onClick={() => void clearAllBubbles()}
          >
            <Eraser className="h-3.5 w-3.5 shrink-0 text-black/50" aria-hidden />
            Clear All
          </button>
        </div>
      ) : null}
    </div>
  );
}
