import type { AgentSource, DomainEvent } from "@mission-control/shared";

export type AdapterHealthStatus = "healthy" | "degraded" | "disconnected";

export interface AdapterHealth {
  readonly status: AdapterHealthStatus;
  readonly message?: string;
}

export interface RunningTaskSnapshot {
  readonly taskId: string;
  readonly title: string;
  readonly source: AgentSource;
  readonly startedAt: number;
  readonly activity: string | null;
}

export type AdapterEventHandler = (event: DomainEvent) => void;

export type AdapterUnsubscribe = () => void;

/**
 * Universal adapter contract for AI coding tools.
 * UI never depends on tool-specific details — only DomainEvents.
 */
export interface AgentAdapter {
  readonly id: string;
  readonly name: string;
  readonly source: AgentSource;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  health(): Promise<AdapterHealth>;

  subscribe(handler: AdapterEventHandler): AdapterUnsubscribe;

  sendMessage(taskId: string, message: string): Promise<void>;
  queueMessage(taskId: string, message: string): Promise<void>;
  stopTask(taskId: string): Promise<void>;
  openConversation(taskId: string): Promise<void>;
  /** Mark task as seen in the HUD without focusing the host app. */
  acknowledgeTask(taskId: string): Promise<void>;

  getRunningTasks(): Promise<readonly RunningTaskSnapshot[]>;
}
