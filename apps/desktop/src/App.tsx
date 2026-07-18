import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createMissionControlEngine } from "./engine/createMissionControlEngine";
import { MissionControlContext } from "./engine/MissionControlContext";
import { FloatingWidget } from "./components/FloatingWidget";
import { TimelinePanel } from "./components/TimelinePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useSettings } from "./hooks/useSettings";

type Panel = "timeline" | "settings";

function applyTheme(theme: "system" | "light" | "dark") {
  const root = document.documentElement;
  if (theme === "system") {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", dark ? "dark" : "light");
    return;
  }
  root.setAttribute("data-theme", theme);
}

function Shell() {
  const [expanded, setExpanded] = useState(true);
  const [panel, setPanel] = useState<Panel>("timeline");
  const { settings } = useSettings();

  useEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== "system") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings.theme]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <FloatingWidget
        expanded={expanded}
        onToggle={() => {
          setExpanded((value) => !value);
        }}
        onOpenSettings={() => {
          setExpanded(true);
          setPanel("settings");
        }}
      />

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            initial={settings.reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={settings.reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
          >
            <div className="flex gap-1 rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] p-1">
              <TabButton active={panel === "timeline"} onClick={() => setPanel("timeline")}>
                Timeline
              </TabButton>
              <TabButton active={panel === "settings"} onClick={() => setPanel("settings")}>
                Settings
              </TabButton>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible pr-0.5">
              {panel === "settings" ? (
                <SettingsPanel onClose={() => setPanel("timeline")} />
              ) : (
                <TimelinePanel />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
        active ? "bg-zinc-900 text-white" : "text-[var(--mc-muted)] hover:text-[var(--mc-text)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [engine] = useState(() => createMissionControlEngine());

  useEffect(() => {
    return () => {
      engine.dispose();
    };
  }, [engine]);

  return (
    <MissionControlContext.Provider value={engine}>
      <Shell />
    </MissionControlContext.Provider>
  );
}
