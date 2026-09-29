// app/workout/active/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActiveWorkoutClient from "./active-client";

export default async function ActiveWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await searchParams;
  const planId = resolvedParams.planId;

  if (!planId) redirect("/");

  const plan = await prisma.workoutPlan.findUnique({
    where: { id: planId, userId: session.user.id },
    include: {
      exercises: { orderBy: { order: "asc" } },
    },
  });

  if (!plan) redirect("/");

  return <ActiveWorkoutClient plan={plan} />;
}