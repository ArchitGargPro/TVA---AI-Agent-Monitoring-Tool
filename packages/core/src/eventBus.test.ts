import { describe, expect, it, beforeEach } from "vitest";
import { createDomainEvent, type DomainEvent } from "@mission-control/shared";
import { EventBus } from "./eventBus";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("appends published events to history without mutating prior entries", () => {
    const first = createDomainEvent("task.started", {
      taskId: "t1",
      source: "cursor",
      title: "Feature",
    });
    const second = createDomainEvent("task.completed", {
      taskId: "t1",
      source: "cursor",
    });

    bus.publish(first);
    bus.publish(second);

    const history = bus.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toBe(first);
    expect(history[1]).toBe(second);

    // Snapshot must not reflect later publishes
    bus.publish(
      createDomainEvent("task.cancelled", {
        taskId: "t1",
        source: "cursor",
      }),
    );
    expect(history).toHaveLength(2);
    expect(bus.getHistory()).toHaveLength(3);
  });

  it("notifies global subscribers in publish order", () => {
    const received: DomainEvent[] = [];
    bus.subscribe((event) => {
      received.push(event);
    });

    const started = createDomainEvent("task.started", {
      taskId: "t1",
      source: "codex",
      title: "Tests",
    });
    const failed = createDomainEvent("task.failed", {
      taskId: "t1",
      source: "codex",
      error: "boom",
    });

    bus.publish(started);
    bus.publish(failed);

    expect(received).toEqual([started, failed]);
  });

  it("notifies typed subscribers only for matching types", () => {
    const waitingEvents: DomainEvent[] = [];
    bus.subscribeType("task.waiting", (event) => {
      waitingEvents.push(event);
    });

    bus.publish(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "claude",
        title: "Review",
      }),
    );

    const waiting = createDomainEvent("task.waiting", {
      taskId: "t1",
      source: "claude",
      reason: "approval",
    });
    bus.publish(waiting);

    expect(waitingEvents).toEqual([waiting]);
  });

  it("stops notifying after unsubscribe", () => {
    const received: DomainEvent[] = [];
    const unsubscribe = bus.subscribe((event) => {
      received.push(event);
    });

    bus.publish(
      createDomainEvent("message.sent", {
        taskId: "t1",
        source: "cursor",
        message: "hello",
      }),
    );
    unsubscribe();
    bus.publish(
      createDomainEvent("message.queued", {
        taskId: "t1",
        source: "cursor",
        message: "later",
      }),
    );

    expect(received).toHaveLength(1);
    expect(received[0]?.type).toBe("message.sent");
  });

  it("clears history and listeners on reset", () => {
    const received: DomainEvent[] = [];
    bus.subscribe((event) => {
      received.push(event);
    });
    bus.publish(
      createDomainEvent("conversation.opened", {
        taskId: "t1",
        source: "cursor",
      }),
    );

    bus.reset();

    expect(bus.getHistory()).toHaveLength(0);
    bus.publish(
      createDomainEvent("task.cancelled", {
        taskId: "t2",
        source: "unknown",
      }),
    );
    expect(received).toHaveLength(1);
  });
});
