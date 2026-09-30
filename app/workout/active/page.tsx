// app/workout/active/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkout } from "@/lib/queries";
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

  const { planId } = await searchParams;
  const workout = await getActiveWorkout(session.user.id, planId);

  const exercises =
    workout.exercises.length > 0
      ? workout.exercises
      : [
          { id: "1", name: "Bench Press", targetSets: 3, restSeconds: 90 },
          { id: "2", name: "Incline Dumbbell Press", targetSets: 3, restSeconds: 90 },
          { id: "3", name: "Tricep Pushdown", targetSets: 3, restSeconds: 60 },
        ];

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
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

        <ActiveWorkoutLogger
          planId={planId}
          exercises={exercises}
          previousLogsMap={workout.previousLogsMap}
        />
      </main>
    </div>
  );
}