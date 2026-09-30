// app/plans/[id]/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PlanEditor from "./PlanEditor";
import SubpageHeader from "@/components/SubpageHeader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlanPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [plan, library] = await Promise.all([
    prisma.workoutPlan.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: { select: { id: true, name: true, tracking: true } } },
        },
      },
    }),
    prisma.exercise.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, tracking: true },
    }),
  ]);

  if (!plan) {
    notFound();
  }

  const formattedExercises = plan.exercises.map((exercise) => ({
    id: exercise.id,
    exerciseId: exercise.exerciseId,
    name: exercise.exercise?.name ?? exercise.name,
    tracking: exercise.exercise?.tracking === "reps" || exercise.exercise?.tracking === "hold"
      ? exercise.exercise.tracking
      : "weight",
    targetSets: exercise.targetSets,
    restSeconds: exercise.restSeconds,
  }));

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        <SubpageHeader title="Bewerk plan" href="/schedule" />

        {/* Het interactieve bewerkingsscherm */}
        <PlanEditor
          planId={plan.id}
          initialName={plan.name}
          exercises={formattedExercises}
          library={library}
        />
      </main>
    </div>
  );
}