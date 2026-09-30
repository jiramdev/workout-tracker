// app/plans/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";
import { exerciseKey, findOrCreateExercise } from "@/lib/exercises";
import { isTracking } from "@/lib/exercise-library";
import { redirect } from "next/navigation";

// 1. Naam van het plan bijwerken
export async function updatePlanName(planId: string, name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  await prisma.workoutPlan.update({
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
  restSeconds: number = 90,
  exerciseId?: string | null,
  tracking?: string | null
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const userId = session.user.id;
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });
  if (!plan) return { error: "Plan niet gevonden." };

  const sets = Number(targetSets);
  const rest = Number(restSeconds);
  if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
    return { error: "Aantal sets moet tussen 1 en 20 liggen." };
  }
  if (!Number.isInteger(rest) || rest < 0 || rest > 600) {
    return { error: "Rusttijd moet tussen 0 en 600 seconden liggen." };
  }

  const exercise = exerciseId
    ? await prisma.exercise.findFirst({ where: { id: exerciseId, userId } })
    : await findOrCreateExercise(userId, exerciseName, tracking);
  if (!exercise) return { error: "Vul een naam in." };

  const duplicate = await prisma.planExercise.findFirst({
    where: {
      planId,
      OR: [
        { exerciseId: exercise.id },
        { name: { equals: exercise.name, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  if (duplicate) return { error: "Deze oefening staat al in het plan." };

  const last = await prisma.planExercise.findFirst({
    where: { planId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.planExercise.create({
    data: {
      planId,
      exerciseId: exercise.id,
      name: exercise.name,
      targetSets: sets,
      restSeconds: rest,
      order: (last?.order ?? -1) + 1,
    },
  });

  refreshUserCache(userId);
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/schedule");
  revalidatePath("/");
  return { success: true };
}

export async function updateExercise(
  planId: string,
  exerciseId: string,
  exerciseName: string,
  targetSets: number,
  restSeconds: number,
  tracking?: string | null
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

  const placement = await prisma.planExercise.findFirst({
    where: { id: exerciseId, planId, plan: { userId: session.user.id } },
    select: { id: true, exerciseId: true, name: true },
  });
  if (!placement) return { error: "Oefening niet gevonden." };

  const shared =
    (placement.exerciseId
      ? await prisma.exercise.findFirst({
          where: { id: placement.exerciseId, userId: session.user.id },
        })
      : null) ?? (await findOrCreateExercise(session.user.id, placement.name));
  if (!shared) return { error: "Vul een naam in." };

  const key = exerciseKey(name);
  const clash = await prisma.exercise.findFirst({
    where: { userId: session.user.id, nameKey: key, NOT: { id: shared.id } },
    select: { id: true },
  });
  if (clash) return { error: "Die oefening bestaat al." };

  await prisma.$transaction([
    prisma.exercise.update({
      where: { id: shared.id },
      data: {
        name,
        nameKey: key,
        ...(isTracking(tracking) ? { tracking } : {}),
      },
    }),
    prisma.planExercise.updateMany({
      where: { exerciseId: shared.id },
      data: { name },
    }),
    prisma.logEntry.updateMany({
      where: { exerciseId: shared.id },
      data: { exerciseName: name },
    }),
    prisma.planExercise.update({
      where: { id: placement.id },
      data: { exerciseId: shared.id, name, targetSets: sets, restSeconds: rest },
    }),
  ]);

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

  const placement = await prisma.planExercise.findFirst({
    where: { id: exerciseId, planId, plan: { userId: session.user.id } },
    select: { id: true },
  });
  if (!placement) return;

  await prisma.planExercise.delete({
    where: { id: placement.id },
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

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });
  if (!plan) return;

  await prisma.$transaction([
    prisma.scheduleDay.deleteMany({ where: { planId: plan.id } }),
    prisma.planExercise.deleteMany({ where: { planId: plan.id } }),
    prisma.workoutPlan.delete({ where: { id: plan.id } }),
  ]);

  refreshUserCache(session.user.id);
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect("/schedule");
}