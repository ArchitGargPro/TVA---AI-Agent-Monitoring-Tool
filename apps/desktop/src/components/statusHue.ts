import type { TimelineTask } from "@mission-control/core";

export type StatusHue = {
  /** Left accent / border color (status signal on whitish cloud). */
  accent: string;
  glow: string;
  label: string;
};

export function statusHue(status: TimelineTask["status"]): StatusHue {
  switch (status) {
    case "running":
      return {
        accent: "#0ea5e9",
        glow: "shadow-[0_4px_14px_rgba(14,165,233,0.28)]",
        label: "in progress",
      };
    case "waiting":
      return {
        accent: "#e11d48",
        glow: "shadow-[0_4px_14px_rgba(225,29,72,0.28)]",
        label: "waiting",
      };
    case "completed":
      return {
        accent: "#10b981",
        glow: "shadow-[0_4px_14px_rgba(16,185,129,0.22)]",
        label: "done",
      };
    case "failed":
      return {
        accent: "#dc2626",
        glow: "shadow-[0_4px_14px_rgba(220,38,38,0.28)]",
        label: "failed",
      };
    default:
      return {
        accent: "#78716c",
        glow: "shadow-[0_4px_12px_rgba(120,113,108,0.2)]",
        label: "cancelled",
      };
  }
}

/** Dominant pulse color for the clock aura — waiting wins, then running, then done. */
export function clockAura(tasks: readonly TimelineTask[]): { color: string; intensity: number } {
  const waiting = tasks.some((task) => task.status === "waiting");
  const running = tasks.some((task) => task.status === "running");
  const failed = tasks.some((task) => task.status === "failed");
  const completed = tasks.some((task) => task.status === "completed");

  if (waiting || failed) {
    return { color: "rgba(244, 63, 94, 0.55)", intensity: 1 };
  }
  if (running) {
    return { color: "rgba(14, 165, 233, 0.5)", intensity: 0.85 };
  }
  if (completed) {
    return { color: "rgba(16, 185, 129, 0.4)", intensity: 0.55 };
  }
  return { color: "rgba(196, 122, 58, 0.35)", intensity: 0.35 };
}
