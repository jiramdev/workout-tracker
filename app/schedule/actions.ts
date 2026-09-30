// app/schedule/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// 1. Koppel een plan aan een specifieke dag (0 = Zo, 1 = Ma ... 6 = Za)
export async function assignPlanToDay(dayOfWeek: number, planId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const userId = session.user.id;

  // Zorg dat het WeeklySchedule record bestaat voor de gebruiker
  const weeklySchedule = await prisma.weeklySchedule.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  // Koppel plan of zet op rustdag (planId: null)
  await prisma.scheduleDay.upsert({
    where: {
      scheduleId_dayOfWeek: {
        scheduleId: weeklySchedule.id,
        dayOfWeek,
      },
    },
    update: {
      planId: planId || null,
    },
    create: {
      scheduleId: weeklySchedule.id,
      dayOfWeek,
      planId: planId || null,
    },
  });

  revalidatePath("/schedule");
  revalidatePath("/");
}

// 2. Nieuw trainingsplan aanmaken
export async function createWorkoutPlan(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  if (!name.trim()) return null;

  const plan = await prisma.workoutPlan.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
    },
  });

  revalidatePath("/schedule");
  return plan;
}