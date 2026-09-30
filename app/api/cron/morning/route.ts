import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import webpush from "web-push";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function amsterdamNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value])
  );

  return {
    dayOfWeek: WEEKDAYS.indexOf(parts.weekday),
    hour: Number(parts.hour),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function exerciseLine(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} en ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} en ${names[names.length - 1]}`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 401 });
  }

  const { dayOfWeek, hour, dateKey } = amsterdamNow();
  if (dayOfWeek < 0 || hour !== 8) {
    return NextResponse.json({ skipped: true });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "VAPID niet ingesteld" }, { status: 500 });
  }

  const days = await prisma.scheduleDay.findMany({
    where: { dayOfWeek, planId: { not: null } },
    select: {
      schedule: { select: { userId: true } },
      plan: {
        select: {
          id: true,
          name: true,
          exercises: { orderBy: { order: "asc" }, select: { name: true } },
        },
      },
    },
  });

  const byUser = new Map<string, { planId: string; name: string; exercises: string[] }>();
  for (const day of days) {
    if (!day.plan || byUser.has(day.schedule.userId)) continue;
    byUser.set(day.schedule.userId, {
      planId: day.plan.id,
      name: day.plan.name,
      exercises: day.plan.exercises.map((exercise) => exercise.name),
    });
  }

  if (byUser.size === 0) return NextResponse.json({ sent: 0 });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: [...byUser.keys()] } },
  });
  if (subscriptions.length === 0) return NextResponse.json({ sent: 0 });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:marijn.snoeren@gmail.com",
    publicKey,
    privateKey
  );

  const dedupeKey = `morning:${dateKey}`;
  const alreadySent = await prisma.appNotification.findMany({
    where: { dedupeKey, userId: { in: [...byUser.keys()] } },
    select: { userId: true },
  });
  const done = new Set(alreadySent.map((item) => item.userId));

  const devices = new Map<string, typeof subscriptions>();
  for (const subscription of subscriptions) {
    if (done.has(subscription.userId) || !byUser.has(subscription.userId)) continue;
    const list = devices.get(subscription.userId) ?? [];
    list.push(subscription);
    devices.set(subscription.userId, list);
  }

  let sent = 0;
  const notified = new Set<string>();

  for (const [userId, userDevices] of devices) {
    const plan = byUser.get(userId);
    if (!plan) continue;

    const names = exerciseLine(plan.exercises);
    const body = names ? `${plan.name}: ${names}` : plan.name;
    const href = `/workout/active?planId=${plan.planId}`;

    try {
      await prisma.appNotification.create({
        data: {
          userId,
          title: "Vandaag",
          body,
          href,
          dedupeKey,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      console.error("Ochtendmelding opslaan mislukt:", error);
      continue;
    }

    notified.add(userId);

    for (const subscription of userDevices) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({ title: "Vandaag", body, url: href }),
          { urgency: "high", TTL: 60 * 60 * 12 }
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => {});
        } else {
          console.error("Ochtendmelding versturen mislukt:", status ?? error);
        }
      }
    }
  }

  if (notified.size > 0) {
    revalidatePath("/");
    revalidatePath("/notifications");
  }

  return NextResponse.json({ sent });
}
