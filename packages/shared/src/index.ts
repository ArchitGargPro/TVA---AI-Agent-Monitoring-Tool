/** Application display name. */
export const APP_NAME = "Mission Control" as const;

/** Current foundation schema version written to SQLite on first launch. */
export const SCHEMA_VERSION = 1 as const;

export type {
  AgentSource,
  ConversationOpenedEvent,
  DomainEvent,
  DomainEventOfType,
  DomainEventType,
  MessageQueuedEvent,
  MessageSentEvent,
  TaskCancelledEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskStartedEvent,
  TaskUpdatedEvent,
  TaskWaitingEvent,
} from "./events";

export { createDomainEvent } from "./events";
