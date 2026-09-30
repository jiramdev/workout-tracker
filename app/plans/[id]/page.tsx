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

  // Haal het plan op van de ingelogde gebruiker
  const plan = await (prisma as any).workoutPlan.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  const formattedExercises = (plan.exercises || []).map((e: any) => ({
    id: e.id,
    name: e.name,
    targetSets: e.targetSets,
    restSeconds: e.restSeconds,
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
        />
      </main>
    </div>
  );
}