// app/actions/workout.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface SetInput {
  setNumber: number;
  reps: number;
  weight: number;
}

interface ExerciseLogInput {
  name: string;
  sets: SetInput[];
}

export async function finishWorkout(planId: string, exercises: ExerciseLogInput[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const validEntries = exercises.flatMap((ex) =>
    ex.sets
      .filter((s) => s.reps > 0 || s.weight > 0)
      .map((s) => ({
        exerciseName: ex.name,
        setNumber: s.setNumber,
        reps: s.reps,
        weight: s.weight,
      }))
  );

  const log = await prisma.workoutLog.create({
    data: {
      userId: session.user.id,
      planId: planId && planId !== "custom" ? planId : null,
      completedAt: new Date(),
      entries: {
        create: validEntries,
      },
    },
  });

  revalidatePath("/");
  return log;
}

export async function logBodyWeight(weight: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  if (!weight || weight <= 0) {
    return { error: "Voer een geldig gewicht in." };
  }

  await prisma.bodyWeightLog.create({
    data: {
      userId: session.user.id,
      weight,
    },
  });

  revalidatePath("/");
  return { success: true };
}