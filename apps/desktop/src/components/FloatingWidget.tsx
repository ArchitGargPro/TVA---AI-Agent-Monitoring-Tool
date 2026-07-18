import { motion } from "framer-motion";
import { APP_NAME } from "@mission-control/shared";
import { useTimelineTasks } from "../hooks/useTimelineTasks";

interface FloatingWidgetProps {
  expanded: boolean;
  onToggle: () => void;
}

export function FloatingWidget({ expanded, onToggle }: FloatingWidgetProps) {
  const { running, waiting, visible } = useTimelineTasks();
  const active = running.length + waiting.length;
  const attention = waiting.length > 0;

  const subtitle =
    waiting.length > 0
      ? `${waiting.length} waiting`
      : active > 0
        ? `${active} in progress`
        : visible.length > 0
          ? `${visible.length} recent`
          : "Idle";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2.5 text-left shadow-sm"
      aria-expanded={expanded}
      aria-label={`${APP_NAME} widget`}
    >
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
          attention
            ? "bg-amber-500/15 text-amber-700"
            : active > 0
              ? "bg-violet-500/15 text-violet-700"
              : "bg-zinc-900/5 text-[var(--mc-muted)]"
        }`}
      >
        {active > 0 ? active : "·"}
        {attention ? (
          <motion.span
            className="absolute inset-0 rounded-lg ring-1 ring-amber-400/50"
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--mc-text)]">
          {APP_NAME}
        </span>
        <span className="block truncate text-[11px] text-[var(--mc-muted)]">{subtitle}</span>
      </span>
    </button>
  );
}
