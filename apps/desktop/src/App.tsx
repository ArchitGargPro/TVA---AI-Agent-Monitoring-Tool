import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createMissionControlEngine } from "./engine/createMissionControlEngine";
import { MissionControlContext } from "./engine/MissionControlContext";
import { FloatingWidget } from "./components/FloatingWidget";
import { TimelinePanel } from "./components/TimelinePanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useSettings } from "./hooks/useSettings";

function Shell() {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = useSettings();

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <FloatingWidget
        expanded={expanded}
        onToggle={() => {
          setExpanded((value) => !value);
          setShowSettings(false);
        }}
        onOpenSettings={() => {
          setExpanded(true);
          setShowSettings(true);
        }}
      />

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            initial={settings.reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={settings.reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {showSettings ? (
              <SettingsPanel onClose={() => setShowSettings(false)} />
            ) : (
              <TimelinePanel />
            )}
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
