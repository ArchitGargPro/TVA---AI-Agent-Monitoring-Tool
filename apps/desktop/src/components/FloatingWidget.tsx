import { motion } from "framer-motion";
import { Activity, Bell, Settings2 } from "lucide-react";
import { APP_NAME } from "@mission-control/shared";
import { useNotifications } from "../hooks/useNotifications";
import { useTimelineTasks } from "../hooks/useTimelineTasks";

interface FloatingWidgetProps {
  expanded: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

export function FloatingWidget({ expanded, onToggle, onOpenSettings }: FloatingWidgetProps) {
  const { count } = useNotifications();
  const { running, waiting } = useTimelineTasks();
  const active = running.length + waiting.length;
  const attention = waiting.length > 0 || count > 0;

  return (
    <motion.div
      layout
      className="flex w-full items-center gap-3 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2.5 shadow-md backdrop-blur"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-expanded={expanded}
        aria-label={`${APP_NAME} widget`}
      >
        <span
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            attention ? "bg-amber-500 text-white" : "bg-zinc-900 text-zinc-50"
          }`}
        >
          <Activity className="h-5 w-5" aria-hidden />
          {attention ? (
            <motion.span
              className="absolute inset-0 rounded-xl ring-2 ring-amber-400/70"
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--mc-text)]">
            {APP_NAME}
          </span>
          <span className="block truncate text-xs text-[var(--mc-muted)]">
            {waiting.length > 0
              ? `${waiting.length} waiting`
              : active > 0
                ? `${active} running`
                : count > 0
                  ? `${count} notification${count === 1 ? "" : "s"}`
                  : "Watching Cursor"}
          </span>
        </span>

        {count > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
            <Bell className="h-3 w-3" aria-hidden />
            {count}
          </span>
        ) : null}
      </button>

      <button
        type="button"
        className="rounded-lg p-1.5 text-[var(--mc-muted)] hover:bg-zinc-500/10 hover:text-[var(--mc-text)]"
        aria-label="Open settings"
        onClick={onOpenSettings}
      >
        <Settings2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
