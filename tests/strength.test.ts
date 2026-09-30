import { describe, expect, it } from "vitest";
import { exerciseProgress, type StrengthWorkout } from "@/lib/strength";

const workouts: StrengthWorkout[] = [
  {
    completedAt: "2026-06-01T10:00:00.000Z",
    entries: [
      { exerciseName: "Squat", weight: 100, reps: 5, durationSeconds: null, tracking: "weight" },
      { exerciseName: "Push-up", weight: 0, reps: 8, durationSeconds: null, tracking: "reps" },
      { exerciseName: "Plank", weight: 0, reps: 0, durationSeconds: 30, tracking: "hold" },
    ],
  },
  {
    completedAt: "2026-06-08T10:00:00.000Z",
    entries: [
      { exerciseName: "Squat", weight: 110, reps: 5, durationSeconds: null, tracking: "weight" },
      { exerciseName: "Push-up", weight: 0, reps: 12, durationSeconds: null, tracking: "reps" },
      { exerciseName: "Plank", weight: 0, reps: 0, durationSeconds: 45, tracking: "hold" },
    ],
  },
];

describe("exercise progress", () => {
  it("uses one series per exercise for the best value and the percent change", () => {
    const progress = exerciseProgress(workouts);
    const squat = progress.find((item) => item.name === "Squat");
    const pushup = progress.find((item) => item.name === "Push-up");
    const plank = progress.find((item) => item.name === "Plank");

    expect(squat?.unit).toBe("kg");
    expect(squat?.best).toBeCloseTo(110 * (1 + 5 / 30));
    expect(squat?.changePct).toBeCloseTo(((110 - 100) / 100) * 100);

    expect(pushup).toMatchObject({ unit: "reps", best: 12 });
    expect(pushup?.changePct).toBeCloseTo(50);

    expect(plank).toMatchObject({ unit: "sec", best: 45 });
    expect(plank?.changePct).toBeCloseTo(50);
  });

  it("hides a percent change until an exercise has two sessions", () => {
    const [only] = exerciseProgress([workouts[0]]);
    expect(only?.changePct).toBeNull();
  });
});
