import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export function exerciseKey(name: string) {
  return name.trim().toLocaleLowerCase("nl");
}

export async function findOrCreateExercise(userId: string, rawName: string) {
  const name = rawName.trim();
  const nameKey = exerciseKey(name);
  if (!nameKey) return null;

  const existing = await prisma.exercise.findUnique({
    where: { userId_nameKey: { userId, nameKey } },
  });
  if (existing) return existing;

  try {
    return await prisma.exercise.create({
      data: { userId, name, nameKey },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.exercise.findUnique({
        where: { userId_nameKey: { userId, nameKey } },
      });
    }
    throw error;
  }
}
