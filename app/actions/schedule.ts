// app/actions/schedule.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserSchedule() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  let schedule = await prisma.weeklySchedule.findUnique({
    where: { userId: session.user.id },
    include: {
      days: {
        include: { plan: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  // Als de gebruiker nog geen schema had, maak er 1 aan voor de 7 dagen (0 = zondag, 1 = maandag, ... 6 = zaterdag)
  if (!schedule) {
    schedule = await prisma.weeklySchedule.create({
      data: {
        userId: session.user.id,
        days: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
          })),
        },
      },
      include: {
        days: {
          include: { plan: true },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });
  }

  return schedule;
}

export async function updateDayPlan(dayOfWeek: number, planId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const schedule = await prisma.weeklySchedule.findUnique({
    where: { userId: session.user.id },
  });

  if (!schedule) throw new Error("Geen schema gevonden");

  await prisma.scheduleDay.upsert({
    where: {
      scheduleId_dayOfWeek: {
        scheduleId: schedule.id,
        dayOfWeek,
      },
    },
    update: {
      planId: planId && planId !== "rest" ? planId : null,
    },
    create: {
      scheduleId: schedule.id,
      dayOfWeek,
      planId: planId && planId !== "rest" ? planId : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/schedule");
  return { success: true };
}