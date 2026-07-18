import type { AgentSource, DomainEvent } from "@mission-control/shared";
import type { EventBus, Unsubscribe } from "./eventBus";

export type TaskStatus = "running" | "waiting" | "completed" | "failed" | "cancelled";

/**
 * Derived projection of a task for timeline / running-task UI.
 * Never mutate; replace via EventBus reductions.
 */
export interface TimelineTask {
  readonly taskId: string;
  readonly title: string;
  readonly source: AgentSource;
  readonly status: TaskStatus;
  readonly startedAt: number;
  readonly updatedAt: number;
  readonly activity: string | null;
  readonly waitingReason: string | null;
  readonly error: string | null;
  /**
   * Completed / failed / cancelled tasks stay visible until the conversation
   * is opened; then they are dismissed from the active timeline.
   */
  readonly dismissed: boolean;
}

export interface TimelineState {
  readonly tasks: ReadonlyMap<string, TimelineTask>;
  readonly events: readonly DomainEvent[];
}

export function createEmptyTimelineState(): TimelineState {
  return {
    tasks: new Map(),
    events: [],
  };
}

function upsertTask(
  tasks: ReadonlyMap<string, TimelineTask>,
  task: TimelineTask,
): ReadonlyMap<string, TimelineTask> {
  const next = new Map(tasks);
  next.set(task.taskId, task);
  return next;
}

/**
 * Pure reducer: append event and update derived task projections.
 */
export function reduceTimeline(state: TimelineState, event: DomainEvent): TimelineState {
  const events = [...state.events, event];
  let tasks = state.tasks;

  switch (event.type) {
    case "task.started": {
      tasks = upsertTask(tasks, {
        taskId: event.taskId,
        title: event.title,
        source: event.source,
        status: "running",
        startedAt: event.timestamp,
        updatedAt: event.timestamp,
        activity: null,
        waitingReason: null,
        error: null,
        dismissed: false,
      });
      break;
    }
    case "task.updated": {
      const existing = tasks.get(event.taskId);
      if (existing && (existing.status === "running" || existing.status === "waiting")) {
        tasks = upsertTask(tasks, {
          ...existing,
          status: "running",
          activity: event.activity,
          waitingReason: null,
          updatedAt: event.timestamp,
        });
      }
      break;
    }
    case "task.waiting": {
      const existing = tasks.get(event.taskId);
      if (existing && (existing.status === "running" || existing.status === "waiting")) {
        tasks = upsertTask(tasks, {
          ...existing,
          status: "waiting",
          waitingReason: event.reason,
          updatedAt: event.timestamp,
        });
      }
      break;
    }
    case "task.completed": {
      const existing = tasks.get(event.taskId);
      if (existing) {
        tasks = upsertTask(tasks, {
          ...existing,
          status: "completed",
          waitingReason: null,
          error: null,
          updatedAt: event.timestamp,
          dismissed: false,
        });
      }
      break;
    }
    case "task.failed": {
      const existing = tasks.get(event.taskId);
      if (existing) {
        tasks = upsertTask(tasks, {
          ...existing,
          status: "failed",
          waitingReason: null,
          error: event.error,
          updatedAt: event.timestamp,
          dismissed: false,
        });
      }
      break;
    }
    case "task.cancelled": {
      const existing = tasks.get(event.taskId);
      if (existing) {
        tasks = upsertTask(tasks, {
          ...existing,
          status: "cancelled",
          waitingReason: null,
          updatedAt: event.timestamp,
          dismissed: false,
        });
      }
      break;
    }
    case "conversation.opened": {
      const existing = tasks.get(event.taskId);
      if (
        existing &&
        (existing.status === "completed" ||
          existing.status === "failed" ||
          existing.status === "cancelled")
      ) {
        tasks = upsertTask(tasks, {
          ...existing,
          dismissed: true,
          updatedAt: event.timestamp,
        });
      }
      break;
    }
    case "message.queued":
    case "message.sent": {
      const existing = tasks.get(event.taskId);
      if (existing && (existing.status === "running" || existing.status === "waiting")) {
        tasks = upsertTask(tasks, {
          ...existing,
          activity: event.type === "message.queued" ? "Message queued" : "Message sent",
          updatedAt: event.timestamp,
        });
      }
      break;
    }
  }

  return { tasks, events };
}

export function listTasks(state: TimelineState): readonly TimelineTask[] {
  return [...state.tasks.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Tasks still shown in the active timeline (not dismissed after conversation open). */
export function selectVisibleTasks(state: TimelineState): readonly TimelineTask[] {
  return listTasks(state).filter((task) => !task.dismissed);
}

export function selectRunningTasks(state: TimelineState): readonly TimelineTask[] {
  return listTasks(state).filter((task) => task.status === "running");
}

export function selectWaitingTasks(state: TimelineState): readonly TimelineTask[] {
  return listTasks(state).filter((task) => task.status === "waiting");
}

export type TimelineListener = (state: TimelineState) => void;

/**
 * Derives timeline / task projections from an EventBus.
 * React must never poll; subscribe for updates instead.
 */
export class TimelineStore {
  private state: TimelineState = createEmptyTimelineState();
  private readonly listeners = new Set<TimelineListener>();
  private readonly unsubscribeBus: Unsubscribe;

  constructor(bus: EventBus) {
    for (const event of bus.getHistory()) {
      this.state = reduceTimeline(this.state, event);
    }

    this.unsubscribeBus = bus.subscribe((event) => {
      this.state = reduceTimeline(this.state, event);
      this.emit();
    });
  }

  getState(): TimelineState {
    return this.state;
  }

  getVisibleTasks(): readonly TimelineTask[] {
    return selectVisibleTasks(this.state);
  }

  getRunningTasks(): readonly TimelineTask[] {
    return selectRunningTasks(this.state);
  }

  getWaitingTasks(): readonly TimelineTask[] {
    return selectWaitingTasks(this.state);
  }

  getEvents(): readonly DomainEvent[] {
    return this.state.events;
  }

  subscribe(listener: TimelineListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Detach from the EventBus. Intended for tests / teardown. */
  dispose(): void {
    this.unsubscribeBus();
    this.listeners.clear();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
