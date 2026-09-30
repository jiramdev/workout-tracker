// app/workout/active/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";
import { exerciseKey } from "@/lib/exercises";

interface CompletedSet {
  exerciseId?: string | null;
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
  const userId = session.user.id;
  const keys = [...new Set(sets.map((set) => exerciseKey(set.exerciseName)).filter(Boolean))];
  const known = keys.length
    ? await prisma.exercise.findMany({
        where: { userId, nameKey: { in: keys } },
        select: { id: true, nameKey: true, name: true },
      })
    : [];
  const byKey = new Map(known.map((exercise) => [exercise.nameKey, exercise]));

  const workoutLog = await prisma.workoutLog.create({
    data: {
      userId,
      planId: planId || null,
      startedAt: new Date(startedAt),
      completedAt,
      entries: {
        create: sets.map((set) => {
          const match = byKey.get(exerciseKey(set.exerciseName));
          return {
            exerciseId: match?.id ?? null,
            exerciseName: match?.name || set.exerciseName,
            setNumber: set.setNumber,
            weight: Number(set.weight) || 0,
            reps: Number(set.reps) || 0,
          };
        }),
      },
    },
  });

  refreshUserCache(userId);
  revalidatePath("/");
  revalidatePath("/analytics");
  return { success: true, workoutLogId: workoutLog.id };
}