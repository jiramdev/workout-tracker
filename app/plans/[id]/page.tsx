// app/plans/[id]/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import PlanEditor from "./PlanEditor";

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
        <header className="flex items-center px-1 py-1">
          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              BEWERK PLAN
            </span>
          </div>
        </header>

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