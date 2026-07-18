import { describe, expect, it } from "vitest";
import { APP_NAME, SCHEMA_VERSION } from "./index";

describe("@mission-control/shared", () => {
  it("exports the application name", () => {
    expect(APP_NAME).toBe("Mission Control");
  });

  it("exports a positive schema version", () => {
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });
});
