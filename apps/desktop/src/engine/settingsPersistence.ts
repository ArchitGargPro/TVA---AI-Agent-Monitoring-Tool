import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, ThemePreference } from "@mission-control/core";
import { DEFAULT_SETTINGS } from "@mission-control/core";

interface PersistedSettings {
  launchAtLogin: boolean;
  showInMenuBar: boolean;
  enableDemoAdapter: boolean;
  theme: string;
  reduceMotion: boolean;
}

function toAppSettings(raw: PersistedSettings): AppSettings {
  const theme: ThemePreference =
    raw.theme === "light" || raw.theme === "dark" || raw.theme === "system" ? raw.theme : "system";

  return {
    launchAtLogin: raw.launchAtLogin,
    showInMenuBar: raw.showInMenuBar,
    enableDemoAdapter: raw.enableDemoAdapter,
    theme,
    reduceMotion: raw.reduceMotion,
  };
}

function toPersisted(settings: AppSettings): PersistedSettings {
  return {
    launchAtLogin: settings.launchAtLogin,
    showInMenuBar: settings.showInMenuBar,
    enableDemoAdapter: settings.enableDemoAdapter,
    theme: settings.theme,
    reduceMotion: settings.reduceMotion,
  };
}

export async function loadPersistedSettings(): Promise<AppSettings> {
  try {
    const raw = await invoke<PersistedSettings>("get_settings");
    return toAppSettings(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function persistSettings(settings: AppSettings): Promise<void> {
  try {
    await invoke("save_settings", { settings: toPersisted(settings) });
  } catch (error) {
    console.warn("[settings] persist failed", error);
  }
}
