import type { AgentSource, DomainEvent } from "@mission-control/shared";
import type { EventBus, Unsubscribe } from "./eventBus";

export type NotificationKind = "waiting" | "completed" | "failed";

export type NotificationPriority = "high" | "normal";

/**
 * Calm, actionable notification derived from domain events.
 * Avoids noisy events (started / updated / message traffic).
 */
export interface AppNotification {
  readonly id: string;
  readonly taskId: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly priority: NotificationPriority;
  readonly source: AgentSource;
  readonly createdAt: number;
}

export interface NotificationState {
  /** Active notifications keyed by taskId (one per task). */
  readonly byTaskId: ReadonlyMap<string, AppNotification>;
}

export function createEmptyNotificationState(): NotificationState {
  return {
    byTaskId: new Map(),
  };
}

function upsertNotification(
  byTaskId: ReadonlyMap<string, AppNotification>,
  notification: AppNotification,
): ReadonlyMap<string, AppNotification> {
  const next = new Map(byTaskId);
  next.set(notification.taskId, notification);
  return next;
}

function removeNotification(
  byTaskId: ReadonlyMap<string, AppNotification>,
  taskId: string,
): ReadonlyMap<string, AppNotification> {
  if (!byTaskId.has(taskId)) {
    return byTaskId;
  }
  const next = new Map(byTaskId);
  next.delete(taskId);
  return next;
}

function resolveTitle(taskId: string, taskTitles: ReadonlyMap<string, string>): string {
  return taskTitles.get(taskId) ?? "Task";
}

/**
 * Pure reducer for notification projections.
 * Only waiting / completed / failed create notifications.
 * conversation.opened and task.cancelled dismiss the task's notification.
 */
export function reduceNotifications(
  state: NotificationState,
  event: DomainEvent,
  taskTitles: ReadonlyMap<string, string> = new Map(),
): NotificationState {
  switch (event.type) {
    case "task.waiting": {
      return {
        byTaskId: upsertNotification(state.byTaskId, {
          id: event.id,
          taskId: event.taskId,
          kind: "waiting",
          title: resolveTitle(event.taskId, taskTitles),
          body: event.reason,
          priority: "high",
          source: event.source,
          createdAt: event.timestamp,
        }),
      };
    }
    case "task.completed": {
      return {
        byTaskId: upsertNotification(state.byTaskId, {
          id: event.id,
          taskId: event.taskId,
          kind: "completed",
          title: resolveTitle(event.taskId, taskTitles),
          body: "Completed",
          priority: "normal",
          source: event.source,
          createdAt: event.timestamp,
        }),
      };
    }
    case "task.failed": {
      return {
        byTaskId: upsertNotification(state.byTaskId, {
          id: event.id,
          taskId: event.taskId,
          kind: "failed",
          title: resolveTitle(event.taskId, taskTitles),
          body: event.error,
          priority: "high",
          source: event.source,
          createdAt: event.timestamp,
        }),
      };
    }
    case "conversation.opened":
    case "task.cancelled": {
      return {
        byTaskId: removeNotification(state.byTaskId, event.taskId),
      };
    }
    case "task.started":
    case "task.updated":
    case "message.queued":
    case "message.sent": {
      return state;
    }
  }
}

export function listNotifications(state: NotificationState): readonly AppNotification[] {
  return [...state.byTaskId.values()].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === "high" ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });
}

export function countNotifications(state: NotificationState): number {
  return state.byTaskId.size;
}

export type NotificationListener = (state: NotificationState) => void;

/**
 * Notification engine: calm alerts derived from EventBus.
 * Waiting and failures take priority; completion is quiet but visible.
 */
export class NotificationEngine {
  private state: NotificationState = createEmptyNotificationState();
  private readonly taskTitles = new Map<string, string>();
  private readonly listeners = new Set<NotificationListener>();
  private readonly unsubscribeBus: Unsubscribe;

  constructor(bus: EventBus) {
    for (const event of bus.getHistory()) {
      this.ingest(event);
    }

    this.unsubscribeBus = bus.subscribe((event) => {
      const previous = this.state;
      this.ingest(event);
      if (this.state !== previous) {
        this.emit();
      }
    });
  }

  getState(): NotificationState {
    return this.state;
  }

  getNotifications(): readonly AppNotification[] {
    return listNotifications(this.state);
  }

  getCount(): number {
    return countNotifications(this.state);
  }

  /** Manually dismiss a task's active notification (e.g. user clears badge). */
  dismiss(taskId: string): void {
    const next = removeNotification(this.state.byTaskId, taskId);
    if (next === this.state.byTaskId) {
      return;
    }
    this.state = { byTaskId: next };
    this.emit();
  }

  subscribe(listener: NotificationListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.unsubscribeBus();
    this.listeners.clear();
  }

  private ingest(event: DomainEvent): void {
    if (event.type === "task.started") {
      this.taskTitles.set(event.taskId, event.title);
    }

    this.state = reduceNotifications(this.state, event, this.taskTitles);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
