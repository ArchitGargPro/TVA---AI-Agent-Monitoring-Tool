import { useEffect, useState } from "react";
import type { TimelineTask } from "@mission-control/core";
import { useMissionControl } from "../engine/MissionControlContext";

export function useTimelineTasks(): {
  visible: readonly TimelineTask[];
  running: readonly TimelineTask[];
  waiting: readonly TimelineTask[];
} {
  const { timeline } = useMissionControl();
  const [visible, setVisible] = useState(timeline.getVisibleTasks());
  const [running, setRunning] = useState(timeline.getRunningTasks());
  const [waiting, setWaiting] = useState(timeline.getWaitingTasks());

  useEffect(() => {
    return timeline.subscribe(() => {
      setVisible(timeline.getVisibleTasks());
      setRunning(timeline.getRunningTasks());
      setWaiting(timeline.getWaitingTasks());
    });
  }, [timeline]);

  return { visible, running, waiting };
}
