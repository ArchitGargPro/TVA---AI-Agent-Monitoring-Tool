import { createContext, useContext } from "react";
import type { MissionControlEngine } from "../engine/createMissionControlEngine";

export const MissionControlContext = createContext<MissionControlEngine | null>(null);

export function useMissionControl(): MissionControlEngine {
  const engine = useContext(MissionControlContext);
  if (!engine) {
    throw new Error("MissionControlEngine not provided");
  }
  return engine;
}
