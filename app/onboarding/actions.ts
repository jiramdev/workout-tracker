"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function saveOnboarding(input: {
  age: string;
  heightCm: string;
  sex: string;
  weight: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const age = parseOptionalNumber(input.age);
  if (input.age.trim() && (age === null || age < 10 || age > 100)) {
    return { error: "Leeftijd moet tussen 10 en 100 liggen." };
  }

  const heightCm = parseOptionalNumber(input.heightCm);
  if (input.heightCm.trim() && (heightCm === null || heightCm < 80 || heightCm > 250)) {
    return { error: "Lengte moet tussen 80 en 250 cm liggen." };
  }

  const weight = parseOptionalNumber(input.weight);
  if (input.weight.trim() && (weight === null || weight <= 0 || weight > 400)) {
    return { error: "Voer een geldig gewicht in." };
  }

  const sex = input.sex === "man" || input.sex === "vrouw" || input.sex === "anders" ? input.sex : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      age: age === null ? null : Math.round(age),
      heightCm,
      sex,
    },
  });

  if (weight !== null) {
    await prisma.bodyWeightLog.create({
      data: { userId: session.user.id, weight },
    });
  }

  refreshUserCache(session.user.id);
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/analytics");
  return { success: true };
}
