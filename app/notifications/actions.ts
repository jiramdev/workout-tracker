"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;
  if (!input.endpoint || !input.p256dh || !input.auth) return;

  await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: session.user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    update: {
      userId: session.user.id,
      p256dh: input.p256dh,
      auth: input.auth,
    },
  });
}

export async function removePushSubscription(endpoint: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !endpoint) return;

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
}

export async function markNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  await prisma.appNotification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
}
