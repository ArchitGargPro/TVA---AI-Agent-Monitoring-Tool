import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createMissionControlEngine } from "./engine/createMissionControlEngine";
import { MissionControlContext } from "./engine/MissionControlContext";
import { FloatingWidget } from "./components/FloatingWidget";
import { TimelinePanel } from "./components/TimelinePanel";
import { useSettings } from "./hooks/useSettings";

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
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <FloatingWidget
        expanded={expanded}
        onToggle={() => {
          setExpanded((value) => !value);
        }}
      />

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            initial={settings.reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={settings.reduceMotion ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <TimelinePanel />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
