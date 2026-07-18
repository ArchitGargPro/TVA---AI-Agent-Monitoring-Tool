import { describe, expect, it } from "vitest";
import { createDomainEvent } from "./events";

describe("createDomainEvent", () => {
  it("creates an immutable task.started event with generated id and timestamp", () => {
    const before = Date.now();
    const event = createDomainEvent("task.started", {
      taskId: "task-1",
      source: "cursor",
      title: "Implement Event Bus",
    });
    const after = Date.now();

    expect(event.type).toBe("task.started");
    expect(event.taskId).toBe("task-1");
    expect(event.source).toBe("cursor");
    expect(event.title).toBe("Implement Event Bus");
    expect(event.id.length).toBeGreaterThan(0);
    expect(event.timestamp).toBeGreaterThanOrEqual(before);
    expect(event.timestamp).toBeLessThanOrEqual(after);
  });

  it("accepts explicit id and timestamp overrides", () => {
    const event = createDomainEvent(
      "task.failed",
      {
        taskId: "task-2",
        source: "claude",
        error: "timeout",
      },
      { id: "evt-fixed", timestamp: 1_700_000_000_000 },
    );

    expect(event.id).toBe("evt-fixed");
    expect(event.timestamp).toBe(1_700_000_000_000);
    expect(event.error).toBe("timeout");
  });
});
