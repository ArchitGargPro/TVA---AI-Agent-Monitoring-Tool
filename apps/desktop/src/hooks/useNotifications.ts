import { useEffect, useState } from "react";
import type { AppNotification } from "@mission-control/core";
import { useMissionControl } from "../engine/MissionControlContext";

export function useNotifications(): {
  items: readonly AppNotification[];
  count: number;
} {
  const { notifications } = useMissionControl();
  const [items, setItems] = useState(notifications.getNotifications());
  const [count, setCount] = useState(notifications.getCount());

  useEffect(() => {
    return notifications.subscribe(() => {
      setItems(notifications.getNotifications());
      setCount(notifications.getCount());
    });
  }, [notifications]);

  return { items, count };
}
