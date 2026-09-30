import { unstable_cache, updateTag } from "next/cache";
import prisma from "@/lib/prisma";

export function userCacheTag(userId: string) {
  return `user:${userId}`;
}

export function refreshUserCache(userId: string) {
  updateTag(userCacheTag(userId));
}

function cached<T>(userId: string, key: string, load: () => Promise<T>) {
  return unstable_cache(load, [key, userId], {
    revalidate: 30,
    tags: [userCacheTag(userId)],
  })();
}

export function getDashboard(userId: string) {
  return cached(userId, "dashboard", async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [scheduleDay, latestWeight, monthlyLogs, user] = await Promise.all([
      prisma.scheduleDay.findFirst({
        where: {
          schedule: { userId },
          dayOfWeek: now.getDay(),
        },
        select: {
          plan: {
            select: {
              id: true,
              name: true,
              _count: { select: { exercises: true } },
            },
          },
        },
      }),
      prisma.bodyWeightLog.findFirst({
        where: { userId },
        orderBy: { loggedAt: "desc" },
        select: { weight: true },
      }),
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { gte: startOfMonth } },
        select: { completedAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
    ]);

    const trainedDaysCount = new Set(
      monthlyLogs
        .filter((log) => log.completedAt)
        .map((log) => new Date(log.completedAt!).getDate())
    ).size;

    return {
      todayPlan: scheduleDay?.plan
        ? {
            id: scheduleDay.plan.id,
            name: scheduleDay.plan.name,
            exerciseCount: scheduleDay.plan._count.exercises,
          }
        : null,
      latestWeight: latestWeight?.weight ?? null,
      profileName: user?.name ?? null,
      profileEmail: user?.email ?? null,
      trainedDaysCount,
      dayOfWeek: now.getDay(),
    };
  });
}

export function getSchedule(userId: string) {
  return cached(userId, "schedule", async () => {
    const [rawPlans, weeklySchedule] = await Promise.all([
      prisma.workoutPlan.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          _count: { select: { exercises: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.weeklySchedule.findUnique({
        where: { userId },
        select: {
          days: { select: { dayOfWeek: true, planId: true } },
        },
      }),
    ]);

    const initialDays: Record<number, string> = {};
    for (const day of weeklySchedule?.days ?? []) {
      if (day.planId) initialDays[day.dayOfWeek] = day.planId;
    }

    return {
      plans: rawPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        exercisesCount: plan._count.exercises,
      })),
      initialDays,
    };
  });
}

export function getActiveWorkout(userId: string, planId?: string) {
  return cached(userId, `active-sets:${planId ?? "none"}`, async () => {
    const [plan, latestWorkout] = await Promise.all([
      planId
        ? prisma.workoutPlan.findFirst({
            where: { id: planId, userId },
            select: {
              exercises: {
                select: {
                  id: true,
                  name: true,
                  targetSets: true,
                  restSeconds: true,
                },
                orderBy: { order: "asc" },
              },
            },
          })
        : Promise.resolve(null),
      prisma.workoutLog.findFirst({
        where: {
          userId,
          completedAt: { not: null },
          ...(planId ? { planId } : {}),
        },
        orderBy: { completedAt: "desc" },
        select: {
          entries: {
            orderBy: { setNumber: "asc" },
            select: { exerciseName: true, setNumber: true, weight: true, reps: true },
          },
        },
      }),
    ]);

    const previousSets: Record<string, { weight: number; reps: number }[]> = {};
    for (const entry of latestWorkout?.entries ?? []) {
      const sets = previousSets[entry.exerciseName] ?? [];
      sets[entry.setNumber - 1] = { weight: entry.weight, reps: entry.reps };
      previousSets[entry.exerciseName] = sets;
    }

    return {
      exercises: plan?.exercises ?? [],
      previousSets,
    };
  });
}

export function getAnalytics(userId: string) {
  return cached(userId, "analytics", async () => {
    const [workouts, weightLogs] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId, completedAt: { not: null } },
        select: {
          completedAt: true,
          entries: {
            select: { exerciseName: true, weight: true, reps: true },
          },
        },
        orderBy: { completedAt: "asc" },
      }),
      prisma.bodyWeightLog.findMany({
        where: { userId },
        orderBy: { loggedAt: "asc" },
        select: { weight: true, loggedAt: true },
      }),
    ]);

    return {
      workouts: workouts.map((workout) => ({
        completedAt: workout.completedAt!.toISOString(),
        entries: workout.entries,
      })),
      weightLogs: weightLogs.map((log) => ({
        weight: log.weight,
        loggedAt: log.loggedAt.toISOString(),
      })),
    };
  });
}
