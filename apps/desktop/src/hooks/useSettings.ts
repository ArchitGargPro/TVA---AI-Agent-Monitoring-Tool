import { useEffect, useState } from "react";
import type { AppSettings } from "@mission-control/core";
import { useMissionControl } from "../engine/MissionControlContext";

export function useSettings(): {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
} {
  const { settings: store } = useMissionControl();
  const [settings, setSettings] = useState(store.get());

  useEffect(() => {
    return store.subscribe(setSettings);
  }, [store]);

  return {
    settings,
    update: (patch) => {
      store.update(patch);
    },
  };
}
