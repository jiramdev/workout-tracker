import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, findMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findUnique },
    pushSubscription: { findMany, delete: vi.fn() },
  },
}));

import { POST } from "@/app/api/rest-timer/send/route";

describe("POST /api/rest-timer/send", () => {
  beforeEach(() => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = "test-current-signing-key";
    process.env.QSTASH_NEXT_SIGNING_KEY = "test-next-signing-key";
    findUnique.mockReset();
    findMany.mockReset();
  });

  it("rejects unsigned requests", async () => {
    const response = await POST(
      new Request("https://workout-tracker.example/api/rest-timer/send", {
        method: "POST",
        body: JSON.stringify({ userId: "user-a", token: "token-a", exerciseName: "Squat" }),
      })
    );

    expect(response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid signature", async () => {
    const response = await POST(
      new Request("https://workout-tracker.example/api/rest-timer/send", {
        method: "POST",
        headers: { "upstash-signature": "not-a-valid-signature" },
        body: JSON.stringify({ userId: "user-a", token: "token-a" }),
      })
    );

    expect(response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
