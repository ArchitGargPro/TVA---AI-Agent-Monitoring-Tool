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
  ContinueAdapter,
  CursorAdapter,
  DemoAdapter,
  GeminiAdapter,
  WindsurfAdapter,
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

  adapters.register(cursor);
  adapters.register(new ClaudeAdapter());
  adapters.register(new CodexAdapter());
  adapters.register(new WindsurfAdapter());
  adapters.register(new ContinueAdapter());
  adapters.register(new GeminiAdapter());
  adapters.register(demo);

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
