import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createDomainEvent } from "@mission-control/shared";
import { EventBus } from "./eventBus";
import {
  NotificationEngine,
  createEmptyNotificationState,
  countNotifications,
  listNotifications,
  reduceNotifications,
} from "./notificationEngine";

describe("reduceNotifications", () => {
  it("ignores noisy events", () => {
    const titles = new Map([["t1", "Feature"]]);
    let state = createEmptyNotificationState();

    state = reduceNotifications(
      state,
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Feature",
      }),
      titles,
    );
    state = reduceNotifications(
      state,
      createDomainEvent("task.updated", {
        taskId: "t1",
        source: "cursor",
        activity: "Editing",
      }),
      titles,
    );
    state = reduceNotifications(
      state,
      createDomainEvent("message.sent", {
        taskId: "t1",
        source: "cursor",
        message: "hi",
      }),
      titles,
    );

    expect(countNotifications(state)).toBe(0);
  });

  it("creates high-priority waiting and failed notifications", () => {
    const titles = new Map([["t1", "Feature"]]);
    let state = reduceNotifications(
      createEmptyNotificationState(),
      createDomainEvent(
        "task.waiting",
        { taskId: "t1", source: "claude", reason: "Need approval" },
        { timestamp: 10 },
      ),
      titles,
    );

    expect(listNotifications(state)[0]).toMatchObject({
      kind: "waiting",
      priority: "high",
      body: "Need approval",
      title: "Feature",
    });

    state = reduceNotifications(
      state,
      createDomainEvent(
        "task.failed",
        { taskId: "t1", source: "claude", error: "Boom" },
        { timestamp: 20 },
      ),
      titles,
    );

    expect(listNotifications(state)).toHaveLength(1);
    expect(listNotifications(state)[0]?.kind).toBe("failed");
  });

  it("dismisses on conversation.opened and task.cancelled", () => {
    const titles = new Map([
      ["t1", "Done"],
      ["t2", "Other"],
    ]);
    let state = reduceNotifications(
      createEmptyNotificationState(),
      createDomainEvent("task.completed", {
        taskId: "t1",
        source: "codex",
      }),
      titles,
    );
    state = reduceNotifications(
      state,
      createDomainEvent("task.failed", {
        taskId: "t2",
        source: "codex",
        error: "x",
      }),
      titles,
    );
    expect(countNotifications(state)).toBe(2);

    state = reduceNotifications(
      state,
      createDomainEvent("conversation.opened", {
        taskId: "t1",
        source: "codex",
      }),
      titles,
    );
    expect(countNotifications(state)).toBe(1);

    state = reduceNotifications(
      state,
      createDomainEvent("task.cancelled", {
        taskId: "t2",
        source: "codex",
      }),
      titles,
    );
    expect(countNotifications(state)).toBe(0);
  });

  it("sorts high priority before normal", () => {
    const titles = new Map([
      ["a", "A"],
      ["b", "B"],
    ]);
    let state = reduceNotifications(
      createEmptyNotificationState(),
      createDomainEvent("task.completed", { taskId: "a", source: "cursor" }, { timestamp: 100 }),
      titles,
    );
    state = reduceNotifications(
      state,
      createDomainEvent(
        "task.waiting",
        { taskId: "b", source: "cursor", reason: "input" },
        { timestamp: 50 },
      ),
      titles,
    );

    const list = listNotifications(state);
    expect(list[0]?.taskId).toBe("b");
    expect(list[1]?.taskId).toBe("a");
  });
});

describe("NotificationEngine", () => {
  let bus: EventBus;
  let engine: NotificationEngine;

  beforeEach(() => {
    bus = new EventBus();
    engine = new NotificationEngine(bus);
  });

  afterEach(() => {
    engine.dispose();
  });

  it("uses task.started title for later notifications", () => {
    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "Implement notifications",
      }),
    );
    bus.publish(
      createDomainEvent("task.completed", {
        taskId: "t1",
        source: "cursor",
      }),
    );

    expect(engine.getNotifications()[0]?.title).toBe("Implement notifications");
    expect(engine.getCount()).toBe(1);
  });

  it("supports manual dismiss and subscribe", () => {
    const counts: number[] = [];
    engine.subscribe((state) => {
      counts.push(countNotifications(state));
    });

    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "cursor",
        title: "X",
      }),
    );
    bus.publish(
      createDomainEvent("task.failed", {
        taskId: "t1",
        source: "cursor",
        error: "err",
      }),
    );

    expect(engine.getCount()).toBe(1);
    engine.dismiss("t1");
    expect(engine.getCount()).toBe(0);
    expect(counts.at(-1)).toBe(0);
  });
});
