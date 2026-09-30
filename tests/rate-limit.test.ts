import { describe, expect, it } from "vitest";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

describe("rate limit", () => {
  it("blocks a key after the configured number of attempts", () => {
    const key = `test:${Math.random()}`;
    const now = 1_000_000;
    expect(isRateLimited(key, 3, 1000, now)).toBe(false);
    recordAttempt(key, 1000, now);
    recordAttempt(key, 1000, now);
    recordAttempt(key, 1000, now);
    expect(isRateLimited(key, 3, 1000, now)).toBe(true);
    expect(isRateLimited(key, 3, 1000, now + 1000)).toBe(false);
  });
});
