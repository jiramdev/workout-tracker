"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { refreshUserCache } from "@/lib/queries";
import bcrypt from "bcryptjs";

export interface AccountInput {
  name: string;
  email: string;
  age: string;
  heightCm: string;
  sex: string;
  weight: string;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function updateAccount(input: AccountInput) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "Vul een gebruikersnaam in." };
  if (!email || !email.includes("@")) return { error: "Vul een geldig e-mailadres in." };

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

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "Dit e-mailadres is al in gebruik." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      age: age === null ? null : Math.round(age),
      heightCm,
      sex,
    },
  });

  if (weight !== null) {
    const latest = await prisma.bodyWeightLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { loggedAt: "desc" },
      select: { weight: true },
    });
    if (!latest || latest.weight !== weight) {
      await prisma.bodyWeightLog.create({
        data: { userId: session.user.id, weight },
      });
    }
  }

  refreshUserCache(session.user.id);
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/analytics");
  return { success: true };
}

export async function updatePassword(currentPassword: string, nextPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  if (!currentPassword || !nextPassword) {
    return { error: "Vul je huidige en nieuwe wachtwoord in." };
  }
  if (nextPassword.length < 8) {
    return { error: "Het nieuwe wachtwoord moet minstens 8 tekens zijn." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account niet gevonden." };

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) return { error: "Huidig wachtwoord klopt niet." };

  const passwordHash = await bcrypt.hash(nextPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true };
}
