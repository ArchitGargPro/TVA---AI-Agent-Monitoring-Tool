import { createDomainEvent, type DomainEvent } from "@mission-control/shared";
import type {
  AgentAdapter,
  AdapterEventHandler,
  AdapterHealth,
  AdapterUnsubscribe,
  RunningTaskSnapshot,
} from "./types";

/**
 * Demo adapter that simulates a short agent lifecycle so the MVP UI
 * can be verified without live IDE integrations.
 */
export class DemoAdapter implements AgentAdapter {
  readonly id = "demo";
  readonly name = "Demo Agent";
  readonly source = "unknown" as const;

  private connected = false;
  private readonly handlers = new Set<AdapterEventHandler>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly taskId = "demo-task-1";
  private running = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.clearTimers();
    this.running = false;
  }

  async health(): Promise<AdapterHealth> {
    return {
      status: this.connected ? "healthy" : "disconnected",
      message: this.connected ? "Demo adapter ready" : "Disconnected",
    };
  }

  subscribe(handler: AdapterEventHandler): AdapterUnsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /** Run a scripted scenario: start → update → wait → complete. */
  async runScenario(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
    this.clearTimers();
    this.running = true;

    this.emit(
      createDomainEvent("task.started", {
        taskId: this.taskId,
        source: this.source,
        title: "Demo: Implement floating widget",
      }),
    );

    this.timers.push(
      setTimeout(() => {
        this.emit(
          createDomainEvent("task.updated", {
            taskId: this.taskId,
            source: this.source,
            activity: "Scaffolding React shell",
          }),
        );
      }, 1200),
    );

    this.timers.push(
      setTimeout(() => {
        this.emit(
          createDomainEvent("task.waiting", {
            taskId: this.taskId,
            source: this.source,
            reason: "Waiting for your approval to continue",
          }),
        );
      }, 2800),
    );
  }

  /** Continue past waiting state → complete. */
  async approveWaiting(): Promise<void> {
    this.emit(
      createDomainEvent("task.updated", {
        taskId: this.taskId,
        source: this.source,
        activity: "Applying approved changes",
      }),
    );

    this.timers.push(
      setTimeout(() => {
        this.emit(
          createDomainEvent("task.completed", {
            taskId: this.taskId,
            source: this.source,
          }),
        );
        this.running = false;
      }, 1500),
    );
  }

  async sendMessage(taskId: string, message: string): Promise<void> {
    this.emit(
      createDomainEvent("message.sent", {
        taskId,
        source: this.source,
        message,
      }),
    );
    if (taskId === this.taskId) {
      await this.approveWaiting();
    }
  }

  async queueMessage(taskId: string, message: string): Promise<void> {
    this.emit(
      createDomainEvent("message.queued", {
        taskId,
        source: this.source,
        message,
      }),
    );
  }

  async stopTask(taskId: string): Promise<void> {
    this.clearTimers();
    this.running = false;
    this.emit(
      createDomainEvent("task.cancelled", {
        taskId,
        source: this.source,
      }),
    );
  }

  async openConversation(taskId: string): Promise<void> {
    this.emit(
      createDomainEvent("conversation.opened", {
        taskId,
        source: this.source,
      }),
    );
  }

  async acknowledgeTask(taskId: string): Promise<void> {
    this.emit(
      createDomainEvent("conversation.opened", {
        taskId,
        source: this.source,
      }),
    );
  }

  async getRunningTasks(): Promise<readonly RunningTaskSnapshot[]> {
    if (!this.running) {
      return [];
    }
    return [
      {
        taskId: this.taskId,
        title: "Demo: Implement floating widget",
        source: this.source,
        startedAt: Date.now(),
        activity: null,
      },
    ];
  }

  private emit(event: DomainEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  private clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }
}
