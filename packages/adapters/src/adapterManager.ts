import type { EventBus } from "@mission-control/core";
import type { AgentAdapter, AdapterUnsubscribe } from "./types";

/**
 * Registers adapters and forwards their domain events onto the shared EventBus.
 */
export class AdapterManager {
  private readonly adapters = new Map<string, AgentAdapter>();
  private readonly unsubscribers = new Map<string, AdapterUnsubscribe>();

  constructor(private readonly bus: EventBus) {}

  register(adapter: AgentAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter already registered: ${adapter.id}`);
    }

    this.adapters.set(adapter.id, adapter);
    const unsubscribe = adapter.subscribe((event) => {
      this.bus.publish(event);
    });
    this.unsubscribers.set(adapter.id, unsubscribe);
  }

  unregister(adapterId: string): void {
    this.unsubscribers.get(adapterId)?.();
    this.unsubscribers.delete(adapterId);
    this.adapters.delete(adapterId);
  }

  get(adapterId: string): AgentAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  list(): readonly AgentAdapter[] {
    return [...this.adapters.values()];
  }

  async connectAll(): Promise<void> {
    await Promise.all([...this.adapters.values()].map((adapter) => adapter.connect()));
  }

  async disconnectAll(): Promise<void> {
    await Promise.all([...this.adapters.values()].map((adapter) => adapter.disconnect()));
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers.values()) {
      unsubscribe();
    }
    this.unsubscribers.clear();
    this.adapters.clear();
  }
}
