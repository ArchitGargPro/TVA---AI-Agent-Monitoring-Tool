import type { DomainEvent, DomainEventOfType, DomainEventType } from "@mission-control/shared";

export type EventListener = (event: DomainEvent) => void;

export type TypedEventListener<T extends DomainEventType> = (event: DomainEventOfType<T>) => void;

export type Unsubscribe = () => void;

/**
 * In-memory, append-only event bus.
 *
 * Events are immutable and never rewritten. Subscribers receive events after
 * they are appended. History is retained for derived stores (Timeline, etc.).
 */
export class EventBus {
  private readonly history: DomainEvent[] = [];
  private readonly listeners = new Set<EventListener>();
  private readonly typedListeners = new Map<DomainEventType, Set<EventListener>>();

  /** Append an event and notify subscribers. Returns the published event. */
  publish(event: DomainEvent): DomainEvent {
    this.history.push(event);

    for (const listener of this.listeners) {
      listener(event);
    }

    const typed = this.typedListeners.get(event.type);
    if (typed) {
      for (const listener of typed) {
        listener(event);
      }
    }

    return event;
  }

  /** Subscribe to every published event. */
  subscribe(listener: EventListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Subscribe to a single event type. */
  subscribeType<T extends DomainEventType>(type: T, listener: TypedEventListener<T>): Unsubscribe {
    let set = this.typedListeners.get(type);
    if (!set) {
      set = new Set();
      this.typedListeners.set(type, set);
    }

    const wrapped = listener as EventListener;
    set.add(wrapped);

    return () => {
      set?.delete(wrapped);
      if (set && set.size === 0) {
        this.typedListeners.delete(type);
      }
    };
  }

  /** Snapshot of all events published so far (append-only history). */
  getHistory(): readonly DomainEvent[] {
    return this.history.slice();
  }

  /** Remove all listeners and clear history. Intended for tests. */
  reset(): void {
    this.history.length = 0;
    this.listeners.clear();
    this.typedListeners.clear();
  }
}
