import { describe, expect, it } from "vitest";
import { amsterdamParts, amsterdamStartOfMonth } from "@/lib/amsterdam";

describe("Europe/Amsterdam calendar", () => {
  it("treats 22:30 UTC in summer as the next Amsterdam day", () => {
    const instant = new Date("2026-06-15T22:30:00.000Z");
    const parts = amsterdamParts(instant);

    expect(parts.dateKey).toBe("2026-06-16");
    expect(parts.dayOfWeek).toBe(2);
    expect(parts.hour).toBe(0);
  });

  it("starts the month at Amsterdam midnight", () => {
    expect(amsterdamStartOfMonth(new Date("2026-06-15T12:00:00.000Z")).toISOString()).toBe(
      "2026-05-31T22:00:00.000Z"
    );
    expect(amsterdamStartOfMonth(new Date("2026-01-15T12:00:00.000Z")).toISOString()).toBe(
      "2025-12-31T23:00:00.000Z"
    );
  });
});
