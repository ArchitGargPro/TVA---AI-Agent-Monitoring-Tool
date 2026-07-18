import type {
  AgentAdapter,
  AdapterEventHandler,
  AdapterHealth,
  AdapterUnsubscribe,
  RunningTaskSnapshot,
} from "./types";
import type { AgentSource, DomainEvent } from "@mission-control/shared";

type UnsupportedAction = "sendMessage" | "queueMessage" | "stopTask" | "openConversation";

/**
 * Base stub for IDE/CLI adapters until native integrations land.
 * Connect/disconnect/health work; action methods throw until implemented.
 */
export abstract class StubAdapter implements AgentAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly source: AgentSource;

  protected connected = false;
  private readonly handlers = new Set<AdapterEventHandler>();

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async health(): Promise<AdapterHealth> {
    return {
      status: this.connected ? "degraded" : "disconnected",
      message: this.connected ? `${this.name} stub connected — live hooks pending` : "Disconnected",
    };
  }

  subscribe(handler: AdapterEventHandler): AdapterUnsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async sendMessage(): Promise<void> {
    this.unsupported("sendMessage");
  }

  async queueMessage(): Promise<void> {
    this.unsupported("queueMessage");
  }

  async stopTask(): Promise<void> {
    this.unsupported("stopTask");
  }

  async openConversation(): Promise<void> {
    this.unsupported("openConversation");
  }

  async acknowledgeTask(): Promise<void> {
    // No-op until live hooks exist.
  }

  async getRunningTasks(): Promise<readonly RunningTaskSnapshot[]> {
    return [];
  }

  protected emit(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  private unsupported(action: UnsupportedAction): never {
    throw new Error(`${this.name} does not support ${action} yet`);
  }
}
