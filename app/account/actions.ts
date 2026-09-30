"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { refreshUserCache } from "@/lib/queries";
import { revalidateTabs } from "@/lib/revalidate-tabs";
import bcrypt from "bcryptjs";
import { passwordRuleError } from "@/lib/password";

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

export async function updateAccount(input: AccountInput, currentPassword = "") {
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

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, passwordHash: true },
  });
  if (!currentUser) return { error: "Account niet gevonden." };

  const emailChanged = email !== currentUser.email;
  if (emailChanged) {
    if (!currentPassword) {
      return { error: "Vul je huidige wachtwoord in om je e-mail te wijzigen." };
    }
    const matches = await bcrypt.compare(currentPassword, currentUser.passwordHash);
    if (!matches) return { error: "Huidig wachtwoord klopt niet." };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "Dit e-mailadres is al in gebruik." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        age: age === null ? null : Math.round(age),
        heightCm,
        sex,
        ...(emailChanged ? { sessionVersion: { increment: 1 } } : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Dit e-mailadres is al in gebruik." };
    }
    throw error;
  }

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
  revalidateTabs();
  return { success: true, emailChanged };
}

export async function updatePassword(currentPassword: string, nextPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Niet ingelogd");

  if (!currentPassword || !nextPassword) {
    return { error: "Vul je huidige en nieuwe wachtwoord in." };
  }
  const tooShort = passwordRuleError(nextPassword, "Het nieuwe wachtwoord");
  if (tooShort) return { error: tooShort };

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
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });

  return { success: true };
}
