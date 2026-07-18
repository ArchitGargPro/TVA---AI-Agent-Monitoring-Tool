export type ThemePreference = "system" | "light" | "dark";

export interface AppSettings {
  readonly launchAtLogin: boolean;
  readonly showInMenuBar: boolean;
  readonly enableDemoAdapter: boolean;
  readonly theme: ThemePreference;
  readonly reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  launchAtLogin: false,
  showInMenuBar: true,
  enableDemoAdapter: true,
  theme: "system",
  reduceMotion: false,
};

export type SettingsListener = (settings: AppSettings) => void;
export type SettingsUnsubscribe = () => void;

/**
 * In-memory settings store. Persistence via SQLite lands with IPC wiring.
 */
export class SettingsStore {
  private settings: AppSettings;
  private readonly listeners = new Set<SettingsListener>();

  constructor(initial: AppSettings = DEFAULT_SETTINGS) {
    this.settings = { ...initial };
  }

  get(): AppSettings {
    return this.settings;
  }

  update(patch: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...patch };
    for (const listener of this.listeners) {
      listener(this.settings);
    }
    return this.settings;
  }

  subscribe(listener: SettingsListener): SettingsUnsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
