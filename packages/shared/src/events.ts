/** Supported AI tool origins for domain events. */
export type AgentSource = "cursor" | "claude" | "codex" | "unknown";

/** Discriminator for all Mission Control domain events. */
export type DomainEventType =
  | "task.started"
  | "task.updated"
  | "task.completed"
  | "task.failed"
  | "task.cancelled"
  | "task.waiting"
  | "message.queued"
  | "message.sent"
  | "conversation.opened";

interface DomainEventBase {
  readonly id: string;
  readonly type: DomainEventType;
  /** Unix epoch milliseconds. */
  readonly timestamp: number;
  readonly taskId: string;
  readonly source: AgentSource;
}

export interface TaskStartedEvent extends DomainEventBase {
  readonly type: "task.started";
  readonly title: string;
}

export interface TaskUpdatedEvent extends DomainEventBase {
  readonly type: "task.updated";
  readonly activity: string;
  /** Optional title refresh when the conversation name changes. */
  readonly title?: string;
}

export interface TaskCompletedEvent extends DomainEventBase {
  readonly type: "task.completed";
}

export interface TaskFailedEvent extends DomainEventBase {
  readonly type: "task.failed";
  readonly error: string;
}

export interface TaskCancelledEvent extends DomainEventBase {
  readonly type: "task.cancelled";
}

export interface TaskWaitingEvent extends DomainEventBase {
  readonly type: "task.waiting";
  readonly reason: string;
  readonly title?: string;
}

export interface MessageQueuedEvent extends DomainEventBase {
  readonly type: "message.queued";
  readonly message: string;
}

export interface MessageSentEvent extends DomainEventBase {
  readonly type: "message.sent";
  readonly message: string;
}

export interface ConversationOpenedEvent extends DomainEventBase {
  readonly type: "conversation.opened";
}

/**
 * Immutable domain event.
 * Never mutate instances; append new events instead.
 */
export type DomainEvent =
  | TaskStartedEvent
  | TaskUpdatedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskCancelledEvent
  | TaskWaitingEvent
  | MessageQueuedEvent
  | MessageSentEvent
  | ConversationOpenedEvent;

export type DomainEventOfType<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;

type EventPayload<T extends DomainEventType> = Omit<
  DomainEventOfType<T>,
  "id" | "timestamp" | "type"
>;

/**
 * Creates an immutable domain event with a generated id and timestamp.
 */
export function createDomainEvent<T extends DomainEventType>(
  type: T,
  payload: EventPayload<T>,
  options?: { id?: string; timestamp?: number },
): DomainEventOfType<T> {
  return {
    id: options?.id ?? createEventId(),
    timestamp: options?.timestamp ?? Date.now(),
    type,
    ...payload,
  } as DomainEventOfType<T>;
}

function createEventId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
