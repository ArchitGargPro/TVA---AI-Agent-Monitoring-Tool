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
import { loadPersistedSettings, persistSettings } from "./settingsPersistence";

export interface MissionControlEngine {
  readonly bus: EventBus;
  readonly timeline: TimelineStore;
  readonly notifications: NotificationEngine;
  readonly settings: SettingsStore;
  readonly adapters: AdapterManager;
  readonly demo: DemoAdapter;
  dispose: () => void;
}

/**
 * Process-lifetime singleton. React StrictMode remounts must not dispose the
 * live Cursor watchers / event subscriptions mid-session.
 */
let sharedEngine: MissionControlEngine | null = null;

export function getMissionControlEngine(): MissionControlEngine {
  if (!sharedEngine) {
    sharedEngine = createMissionControlEngine();
  }
  return sharedEngine;
}

/** @internal test helper */
export function resetMissionControlEngineForTests(): void {
  if (sharedEngine) {
    sharedEngine.dispose();
    sharedEngine = null;
  }
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

  let persistEnabled = false;
  settings.subscribe((next) => {
    if (!persistEnabled) {
      return;
    }
    void persistSettings(next);
  });

  void loadPersistedSettings()
    .then((saved) => {
      settings.update(saved);
      persistEnabled = true;
    })
    .catch((error: unknown) => {
      persistEnabled = true;
      logger.warning("Failed to load settings", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

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

  const engine: MissionControlEngine = {
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
      if (sharedEngine === engine) {
        sharedEngine = null;
      }
    },
  };

  return engine;
}
