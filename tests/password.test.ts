import { describe, expect, it } from "vitest";
import { passwordRuleError } from "@/lib/password";

describe("password rule", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(passwordRuleError("kort")).toBe("Het wachtwoord moet minstens 8 tekens zijn.");
    expect(passwordRuleError("1234567", "Het nieuwe wachtwoord")).toBe(
      "Het nieuwe wachtwoord moet minstens 8 tekens zijn."
    );
  });

  it("accepts a password of 8 characters", () => {
    expect(passwordRuleError("12345678")).toBeNull();
  });
});
