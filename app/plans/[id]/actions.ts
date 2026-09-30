// app/plans/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";
import { redirect } from "next/navigation";

// 1. Naam van het plan bijwerken
export async function updatePlanName(planId: string, name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  await (prisma as any).workoutPlan.update({
    where: { id: planId, userId: session.user.id },
    data: { name: name.trim() },
  });

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

// 2. Oefening toevoegen aan het plan (alleen velden die werkelijk in schema bestaan)
export async function addExerciseToPlan(
  planId: string,
  exerciseName: string,
  targetSets: number = 3,
  restSeconds: number = 90
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");
  if (!exerciseName.trim()) return;

  const existingExercises = await (prisma as any).planExercise.findMany({
    where: { planId },
    orderBy: { order: "desc" },
    take: 1,
  });

  const nextOrder = existingExercises.length > 0 ? (existingExercises[0].order ?? 0) + 1 : 0;

  await (prisma as any).planExercise.create({
    data: {
      planId,
      name: exerciseName.trim(),
      targetSets: Number(targetSets) || 3,
      restSeconds: Number(restSeconds) || 90,
      order: nextOrder,
    },
  });

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

// 3. Oefening verwijderen uit het plan
export async function removeExerciseFromPlan(planId: string, exerciseId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  await (prisma as any).planExercise.delete({
    where: { id: exerciseId },
  });

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

// 4. Volledig trainingsplan verwijderen
export async function deletePlan(planId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  await (prisma as any).scheduleDay.deleteMany({
    where: { planId },
  });

  await (prisma as any).planExercise.deleteMany({
    where: { planId },
  });

  await (prisma as any).workoutPlan.delete({
    where: { id: planId, userId: session.user.id },
  });

  refreshUserCache(session.user.id);
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect("/schedule");
}