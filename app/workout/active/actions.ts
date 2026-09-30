// app/workout/active/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface CompletedSet {
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
}

export async function finishWorkout({
  planId,
  startedAt,
  sets,
}: {
  planId?: string | null;
  startedAt: string;
  sets: CompletedSet[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const completedAt = new Date();

  // Maak de WorkoutLog aan inclusief alle LogEntry records
  const workoutLog = await prisma.workoutLog.create({
    data: {
      userId: session.user.id,
      planId: planId || null,
      startedAt: new Date(startedAt),
      completedAt,
      entries: {
        create: sets.map((s) => ({
          exerciseName: s.exerciseName,
          setNumber: s.setNumber,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: true, workoutLogId: workoutLog.id };
}