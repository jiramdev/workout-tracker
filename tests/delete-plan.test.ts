import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirst, transaction, scheduleDelete, exerciseDelete, planDelete } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  transaction: vi.fn(),
  scheduleDelete: vi.fn(),
  exerciseDelete: vi.fn(),
  planDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    workoutPlan: { findFirst, delete: planDelete },
    scheduleDay: { deleteMany: scheduleDelete },
    planExercise: { findFirst: vi.fn(), deleteMany: exerciseDelete, delete: vi.fn() },
    $transaction: transaction,
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/queries", () => ({
  refreshUserCache: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { getServerSession } from "next-auth";
import { deletePlan } from "@/app/plans/[id]/actions";

describe("deletePlan", () => {
  beforeEach(() => {
    findFirst.mockReset();
    transaction.mockReset();
    scheduleDelete.mockReset();
    exerciseDelete.mockReset();
    planDelete.mockReset();
    vi.mocked(getServerSession).mockReset();
  });

  it("cannot delete another user's plan", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-a" } } as never);
    findFirst.mockResolvedValue(null);

    await deletePlan("plan-owned-by-user-b");

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "plan-owned-by-user-b", userId: "user-a" },
      select: { id: true },
    });
    expect(transaction).not.toHaveBeenCalled();
    expect(scheduleDelete).not.toHaveBeenCalled();
    expect(exerciseDelete).not.toHaveBeenCalled();
    expect(planDelete).not.toHaveBeenCalled();
  });

  it("deletes an owned plan in one transaction", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-a" } } as never);
    findFirst.mockResolvedValue({ id: "plan-a" });
    transaction.mockResolvedValue([]);

    await expect(deletePlan("plan-a")).rejects.toThrow("NEXT_REDIRECT");

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(scheduleDelete).toHaveBeenCalledWith({ where: { planId: "plan-a" } });
    expect(exerciseDelete).toHaveBeenCalledWith({ where: { planId: "plan-a" } });
    expect(planDelete).toHaveBeenCalledWith({ where: { id: "plan-a" } });
  });
});
