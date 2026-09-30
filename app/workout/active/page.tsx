// app/workout/active/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveWorkout } from "@/lib/queries";
import { redirect } from "next/navigation";
import ActiveWorkoutLogger from "./ActiveWorkoutLogger";
import SubpageHeader from "@/components/SubpageHeader";

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
    <div className="min-h-screen bg-[#baa3d0] text-white pb-10 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        <SubpageHeader title="Workout" href="/" />

        <ActiveWorkoutLogger
          planId={planId}
          exercises={exercises}
          previousSets={workout.previousSets}
        />
      </main>
    </div>
  );
}