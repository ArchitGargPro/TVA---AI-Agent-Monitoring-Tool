import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("@mission-control/ui", () => {
  it("exports Button", () => {
    expect(Button).toBeTypeOf("function");
  });
});
