import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  getMissionControlEngine,
  type MissionControlEngine,
} from "./engine/createMissionControlEngine";
import { MissionControlContext } from "./engine/MissionControlContext";
import { HubPanel } from "./components/HubPanel";
import { FloatingShell } from "./components/FloatingShell";

type WindowMode = "main" | "fidget";

function FidgetApp() {
  const [engine] = useState<MissionControlEngine>(() => getMissionControlEngine());
  return (
    <MissionControlContext.Provider value={engine}>
      <FloatingShell />
    </MissionControlContext.Provider>
  );
}

export default function App() {
  const [mode, setMode] = useState<WindowMode | null>(null);

  useEffect(() => {
    const label = getCurrentWindow().label;
    setMode(label === "fidget" ? "fidget" : "main");
    document.documentElement.dataset.window = label === "fidget" ? "fidget" : "main";
  }, []);

  if (!mode) {
    return (
      <div className="flex h-full items-center justify-center font-sans text-xs text-[#8b7355]">
        Starting…
      </div>
    );
  }

  if (mode === "main") {
    return <HubPanel />;
  }

  return <FidgetApp />;
}
