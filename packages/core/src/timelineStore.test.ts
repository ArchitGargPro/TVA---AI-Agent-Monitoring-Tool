import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createDomainEvent } from "@mission-control/shared";
import { EventBus } from "./eventBus";
import {
  TimelineStore,
  createEmptyTimelineState,
  reduceTimeline,
  selectActiveTasks,
  selectRunningTasks,
  selectVisibleTasks,
  selectWaitingTasks,
} from "./timelineStore";

describe("reduceTimeline", () => {
  it("creates a running task on task.started", () => {
    const state = reduceTimeline(
      createEmptyTimelineState(),
      createDomainEvent(
        "task.started",
        { taskId: "t1", source: "cursor", title: "Feature" },
        { timestamp: 100 },
      ),
    );

    const task = state.tasks.get("t1");
    expect(task?.status).toBe("running");
    expect(task?.title).toBe("Feature");
    expect(task?.startedAt).toBe(100);
    expect(task?.dismissed).toBe(false);
  });

  it("updates activity and clears waiting on task.updated", () => {
    let state = reduceTimeline(
      createEmptyTimelineState(),
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "claude",
        title: "Review",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.waiting", {
        taskId: "t1",
        source: "claude",
        reason: "approval",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.updated", {
        taskId: "t1",
        source: "claude",
        activity: "Writing tests",
      }),
    );

    const task = state.tasks.get("t1");
    expect(task?.status).toBe("running");
    expect(task?.activity).toBe("Writing tests");
    expect(task?.waitingReason).toBeNull();
  });

  it("revives completed tasks when new activity arrives", () => {
    let state = reduceTimeline(
      createEmptyTimelineState(),
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Feature",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.completed", {
        taskId: "t1",
        source: "cursor",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("conversation.opened", {
        taskId: "t1",
        source: "cursor",
      }),
    );
    expect(selectVisibleTasks(state)).toHaveLength(0);

    state = reduceTimeline(
      state,
      createDomainEvent("task.waiting", {
        taskId: "t1",
        source: "cursor",
        reason: "Need input",
        title: "Follow-up",
      }),
    );

    expect(selectVisibleTasks(state)).toHaveLength(1);
    expect(selectVisibleTasks(state)[0]?.status).toBe("waiting");
    expect(selectVisibleTasks(state)[0]?.dismissed).toBe(false);
  });

  it("keeps completed tasks visible until conversation.opened", () => {
    let state = reduceTimeline(
      createEmptyTimelineState(),
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "codex",
        title: "Tests",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.completed", {
        taskId: "t1",
        source: "codex",
      }),
    );

    expect(selectVisibleTasks(state)).toHaveLength(1);
    expect(selectVisibleTasks(state)[0]?.status).toBe("completed");

    state = reduceTimeline(
      state,
      createDomainEvent("conversation.opened", {
        taskId: "t1",
        source: "codex",
      }),
    );

    expect(selectVisibleTasks(state)).toHaveLength(0);
    expect(state.tasks.get("t1")?.dismissed).toBe(true);
  });

  it("selects running and waiting tasks", () => {
    let state = reduceTimeline(
      createEmptyTimelineState(),
      createDomainEvent("task.started", {
        taskId: "run",
        source: "cursor",
        title: "A",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.started", {
        taskId: "wait",
        source: "claude",
        title: "B",
      }),
    );
    state = reduceTimeline(
      state,
      createDomainEvent("task.waiting", {
        taskId: "wait",
        source: "claude",
        reason: "credentials",
      }),
    );

    expect(selectRunningTasks(state).map((t) => t.taskId)).toEqual(["run"]);
    expect(selectWaitingTasks(state).map((t) => t.taskId)).toEqual(["wait"]);
    expect(selectActiveTasks(state).map((t) => t.taskId)).toEqual(["wait", "run"]);

    state = reduceTimeline(
      state,
      createDomainEvent("conversation.opened", {
        taskId: "run",
        source: "cursor",
      }),
    );
    expect(selectRunningTasks(state)).toHaveLength(0);
    expect(selectActiveTasks(state).map((t) => t.taskId)).toEqual(["wait"]);
  });
});

describe("TimelineStore", () => {
  let bus: EventBus;
  let store: TimelineStore;

  beforeEach(() => {
    bus = new EventBus();
    store = new TimelineStore(bus);
  });

  afterEach(() => {
    store.dispose();
  });

  it("replays existing bus history on construction", () => {
    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Existing",
      }),
    );
    store.dispose();
    store = new TimelineStore(bus);

    expect(store.getRunningTasks()).toHaveLength(1);
    expect(store.getRunningTasks()[0]?.title).toBe("Existing");
  });

  it("notifies subscribers when the bus publishes", () => {
    const snapshots: number[] = [];
    store.subscribe((state) => {
      snapshots.push(state.events.length);
    });

    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Live",
      }),
    );

    expect(snapshots).toEqual([1]);
    expect(store.getEvents()).toHaveLength(1);
  });

  it("stops updating after dispose", () => {
    store.dispose();
    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Ignored",
      }),
    );
    expect(store.getEvents()).toHaveLength(0);
  });
});
