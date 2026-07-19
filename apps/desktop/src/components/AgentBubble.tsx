import { motion } from "framer-motion";
import type { TimelineTask } from "@mission-control/core";
import { statusHue } from "./statusHue";

interface AgentBubbleProps {
  task: TimelineTask;
  index: number;
  onFocus: (taskId: string) => void;
}

function appLabel(source: TimelineTask["source"]): string {
  switch (source) {
    case "cursor":
      return "CURSOR";
    case "claude":
      return "CLAUDE";
    case "codex":
      return "CODEX";
    default:
      return source.toUpperCase();
  }
}

function statusDot(status: TimelineTask["status"]): string {
  return statusHue(status).accent;
}

function lineTwo(task: TimelineTask): string {
  if (task.status === "waiting") {
    return task.waitingReason ?? task.activity ?? "Waiting…";
  }
  if (task.status === "running") {
    return task.activity ?? "Working…";
  }
  if (task.status === "failed") {
    return task.error ?? "Failed";
  }
  return task.activity ?? "Done";
}

export function AgentBubble({ task, index, onFocus }: AgentBubbleProps) {
  const hue = statusHue(task.status);
  const reply = lineTwo(task);
  const isWaiting = task.status === "waiting";

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12, scale: 0.92 }}
      transition={{
        type: "spring",
        stiffness: 560,
        damping: 20,
        mass: 0.5,
        delay: index * 0.035,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onFocus(task.taskId);
      }}
      className="w-[220px] rounded-xl border border-black/10 bg-white/92 px-2.5 py-1.5 text-left shadow-md backdrop-blur-sm"
      aria-label={`Focus ${task.title}`}
    >
      <span className="block truncate font-sans text-[11px] font-medium leading-snug text-black">
        {task.title}
      </span>
      <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 font-sans text-[7.5px] font-semibold tracking-wide text-black/45">
          {appLabel(task.source)}
        </span>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: statusDot(task.status) }}
          aria-hidden
        />
        <span
          className={`min-w-0 truncate font-sans leading-snug ${
            isWaiting
              ? "text-[11px] font-medium text-black/80"
              : "text-[10.5px] text-black/65"
          }`}
          style={isWaiting ? { color: hue.accent } : undefined}
        >
          {reply}
        </span>
      </span>
    </motion.button>
  );
}
