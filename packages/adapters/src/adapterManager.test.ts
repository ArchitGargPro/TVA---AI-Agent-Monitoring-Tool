import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { EventBus } from "@mission-control/core";
import { createDomainEvent, type DomainEvent } from "@mission-control/shared";
import { AdapterManager } from "./adapterManager";
import type { AgentAdapter, AdapterEventHandler, AdapterUnsubscribe } from "./types";

function createStubAdapter(id: string): AgentAdapter & { emit: (event: DomainEvent) => void } {
  const handlers = new Set<AdapterEventHandler>();

  return {
    id,
    name: id,
    source: "unknown",
    emit(event) {
      for (const handler of handlers) {
        handler(event);
      }
    },
    async connect() {},
    async disconnect() {},
    async health() {
      return { status: "healthy" as const };
    },
    subscribe(handler): AdapterUnsubscribe {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    async sendMessage() {},
    async queueMessage() {},
    async stopTask() {},
    async openConversation() {},
    async acknowledgeTask() {},
    async getRunningTasks() {
      return [];
    },
  };
}

describe("AdapterManager", () => {
  let bus: EventBus;
  let manager: AdapterManager;

  beforeEach(() => {
    bus = new EventBus();
    manager = new AdapterManager(bus);
  });

  afterEach(() => {
    manager.dispose();
  });

  it("forwards adapter events onto the EventBus", () => {
    const adapter = createStubAdapter("demo");
    manager.register(adapter);

    adapter.emit(
      createDomainEvent("task.started", {
        taskId: "t1",
        source: "unknown",
        title: "From adapter",
      }),
    );

    expect(bus.getHistory()).toHaveLength(1);
    expect(bus.getHistory()[0]?.type).toBe("task.started");
  });

  it("rejects duplicate adapter ids", () => {
    manager.register(createStubAdapter("demo"));
    expect(() => manager.register(createStubAdapter("demo"))).toThrow(/already registered/);
  });
});
