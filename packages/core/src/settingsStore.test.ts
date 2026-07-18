import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SettingsStore } from "./settingsStore";
import { Logger } from "./logger";

describe("SettingsStore", () => {
  it("updates settings and notifies subscribers", () => {
    const store = new SettingsStore();
    const seen: boolean[] = [];
    store.subscribe((settings) => {
      seen.push(settings.enableDemoAdapter);
    });

    expect(store.get()).toEqual(DEFAULT_SETTINGS);
    store.update({ enableDemoAdapter: false });
    expect(store.get().enableDemoAdapter).toBe(false);
    expect(seen).toEqual([false]);
  });
});

describe("Logger", () => {
  it("respects minimum level", () => {
    const records: string[] = [];
    const logger = new Logger("warning", (record) => {
      records.push(record.level);
    });

    logger.debug("d");
    logger.info("i");
    logger.warning("w");
    logger.error("e");

    expect(records).toEqual(["warning", "error"]);
  });
});
