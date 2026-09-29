// app/actions/plans.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface ExerciseInput {
  name: string;
  targetSets: number;
  restSeconds: number;
}

export async function createWorkoutPlan(data: {
  name: string;
  exercises: ExerciseInput[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Niet ingelogd");
  }

  if (!data.name.trim()) {
    return { error: "Geef het plan een naam (bijv. Push Day)." };
  }

  if (!data.exercises || data.exercises.length === 0) {
    return { error: "Voeg minimaal één oefening toe." };
  }

  await prisma.workoutPlan.create({
    data: {
      userId: session.user.id,
      name: data.name.trim(),
      exercises: {
        create: data.exercises.map((ex, index) => ({
          name: ex.name.trim(),
          targetSets: Number(ex.targetSets) || 3,
          restSeconds: Number(ex.restSeconds) || 90,
          order: index,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/plans");
  redirect("/plans");
}

export async function getUserPlans() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return await prisma.workoutPlan.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}