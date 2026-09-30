import { describe, expect, it } from "vitest";
import { sessionStillValid } from "@/lib/session-version";

describe("session version", () => {
  it("treats a missing token version as 0", () => {
    expect(sessionStillValid(undefined, 0)).toBe(true);
    expect(sessionStillValid(undefined, 1)).toBe(false);
  });

  it("rejects a token after the stored version is bumped", () => {
    expect(sessionStillValid(1, 2)).toBe(false);
    expect(sessionStillValid(2, 2)).toBe(true);
  });
});
