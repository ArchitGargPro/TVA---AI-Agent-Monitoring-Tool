import {
  EventBus,
  NotificationEngine,
  SettingsStore,
  TimelineStore,
  logger,
} from "@mission-control/core";
import {
  AdapterManager,
  ClaudeAdapter,
  CodexAdapter,
  CursorAdapter,
  DemoAdapter,
} from "@mission-control/adapters";

export interface MissionControlEngine {
  readonly bus: EventBus;
  readonly timeline: TimelineStore;
  readonly notifications: NotificationEngine;
  readonly settings: SettingsStore;
  readonly adapters: AdapterManager;
  readonly demo: DemoAdapter;
  dispose: () => void;
}

export function createMissionControlEngine(): MissionControlEngine {
  const bus = new EventBus();
  const timeline = new TimelineStore(bus);
  const notifications = new NotificationEngine(bus);
  const settings = new SettingsStore();
  const adapters = new AdapterManager(bus);

  const demo = new DemoAdapter();
  const cursor = new CursorAdapter();
  const claude = new ClaudeAdapter();
  const codex = new CodexAdapter();

  adapters.register(demo);
  adapters.register(cursor);
  adapters.register(claude);
  adapters.register(codex);

  void adapters
    .connectAll()
    .then(() => {
      logger.info("Adapters connected", {
        adapters: adapters.list().map((adapter) => adapter.id),
      });
    })
    .catch((error: unknown) => {
      logger.error("Failed to connect adapters", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

  return {
    bus,
    timeline,
    notifications,
    settings,
    adapters,
    demo,
    dispose: () => {
      timeline.dispose();
      notifications.dispose();
      adapters.dispose();
      bus.reset();
    },
  };
}
