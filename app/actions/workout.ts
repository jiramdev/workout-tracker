// app/actions/workout.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";

export async function logBodyWeight(weight: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  if (!weight || weight <= 0) {
    return { error: "Voer een geldig gewicht in." };
  }

  await prisma.bodyWeightLog.create({
    data: {
      userId: session.user.id,
      weight,
    },
  });

  refreshUserCache(session.user.id);
  revalidatePath("/");
  return { success: true };
}