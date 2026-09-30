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
      targetSets: Number.isInteger(Number(targetSets)) && Number(targetSets) >= 1 ? Number(targetSets) : 3,
      restSeconds: Number.isInteger(Number(restSeconds)) && Number(restSeconds) >= 0 ? Number(restSeconds) : 90,
      order: nextOrder,
    },
  });

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
}

export async function updateExercise(
  planId: string,
  exerciseId: string,
  exerciseName: string,
  targetSets: number,
  restSeconds: number
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const name = exerciseName.trim();
  const sets = Number(targetSets);
  const rest = Number(restSeconds);
  if (!name) return { error: "Vul een naam in." };
  if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
    return { error: "Aantal sets moet tussen 1 en 20 liggen." };
  }
  if (!Number.isInteger(rest) || rest < 0 || rest > 600) {
    return { error: "Rusttijd moet tussen 0 en 600 seconden liggen." };
  }

  const exercise = await prisma.planExercise.findFirst({
    where: { id: exerciseId, planId, plan: { userId: session.user.id } },
    select: { id: true },
  });
  if (!exercise) return { error: "Oefening niet gevonden." };

  await prisma.planExercise.update({
    where: { id: exerciseId },
    data: { name, targetSets: sets, restSeconds: rest },
  });

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
  return { success: true };
}

export async function reorderExercises(planId: string, orderedIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const existing = await prisma.planExercise.findMany({
    where: { planId, plan: { userId: session.user.id } },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((exercise) => exercise.id));
  if (
    orderedIds.length !== existing.length ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    return { error: "De volgorde kon niet worden opgeslagen." };
  }

  await prisma.$transaction(
    orderedIds.map((id, order) =>
      prisma.planExercise.update({
        where: { id },
        data: { order },
      })
    )
  );

  refreshUserCache(session.user.id);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
  return { success: true };
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