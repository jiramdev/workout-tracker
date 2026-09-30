import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getToken } = vi.hoisted(() => ({
  getToken: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({
  getToken,
}));

import { proxy } from "@/proxy";

describe("proxy", () => {
  beforeEach(() => {
    getToken.mockReset();
  });

  it("sends an anonymous visitor to the login page", async () => {
    getToken.mockResolvedValue(null);
    const response = await proxy(new NextRequest("https://repiq.example/analytics"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("callbackUrl=%2Fanalytics");
  });

  it("lets a signed-in visitor through and keeps the path header", async () => {
    getToken.mockResolvedValue({ sub: "user-1" });
    const response = await proxy(new NextRequest("https://repiq.example/account"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
