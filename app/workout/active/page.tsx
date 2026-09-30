// app/workout/active/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ActiveWorkoutLogger from "./ActiveWorkoutLogger";

interface PageProps {
  searchParams: Promise<{ planId?: string }>;
}

export default async function ActiveWorkoutPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { planId } = await searchParams;

  let exercises: Array<{
    id: string;
    name: string;
    targetSets: number;
  }> = [];

  if (planId) {
    const plan = await prisma.workoutPlan.findFirst({
      where: { id: planId, userId },
      include: {
        exercises: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (plan) {
      exercises = plan.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        targetSets: e.targetSets || 3,
      }));
    }
  }

  // Vorige gewichten & reps ophalen voor placeholder/default
  const exerciseNames = exercises.map((e) => e.name);
  const previousEntries = await prisma.logEntry.findMany({
    where: {
      exerciseName: { in: exerciseNames },
      workoutLog: { userId },
    },
    orderBy: {
      workoutLog: { completedAt: "desc" },
    },
  });

  const previousLogsMap: Record<string, { weight: number; reps: number }> = {};
  previousEntries.forEach((entry) => {
    if (!previousLogsMap[entry.exerciseName]) {
      previousLogsMap[entry.exerciseName] = {
        weight: entry.weight,
        reps: entry.reps,
      };
    }
  });

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        {/* Top Header: Identiek aan analytics & homepage */}
        <header className="flex justify-between items-center px-1 py-1">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </Link>

          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              WORKOUT
            </span>
          </div>
        </header>

        {/* Minimalistische Logger */}
        <ActiveWorkoutLogger
          planId={planId}
          exercises={exercises}
          previousLogsMap={previousLogsMap}
        />
      </main>
    </div>
  );
}