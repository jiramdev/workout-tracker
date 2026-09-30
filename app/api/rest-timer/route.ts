// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Client } from "@upstash/qstash";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MIN_DELAY_SECONDS = 1;
const MAX_DELAY_SECONDS = 60 * 60;

function restDelaySeconds(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 90;
  return Math.min(MAX_DELAY_SECONDS, Math.max(MIN_DELAY_SECONDS, Math.round(parsed)));
}

function appOrigin() {
  const raw = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  return raw;
}

function readSubscription(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const subscription = value as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  if (typeof subscription.endpoint !== "string" || !subscription.endpoint) return null;
  const p256dh = subscription.keys?.p256dh;
  const auth = subscription.keys?.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string" || !p256dh || !auth) return null;
  return { endpoint: subscription.endpoint, p256dh, auth };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { subscription, delaySeconds, exerciseName, planId, token } = await req.json();

    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Geen timer" }, { status: 400 });
    }

    const storedSubscription = readSubscription(subscription);
    if (!storedSubscription) {
      return NextResponse.json({ error: "Geen subscription" }, { status: 400 });
    }

    const qstashToken = process.env.QSTASH_TOKEN;
    const origin = appOrigin();
    if (!qstashToken) {
      console.error("QSTASH_TOKEN ontbreekt");
      return NextResponse.json({ error: "QStash token ontbreekt" }, { status: 500 });
    }
    if (!origin) {
      console.error("APP_URL ontbreekt");
      return NextResponse.json({ error: "APP_URL ontbreekt" }, { status: 500 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint: storedSubscription.endpoint },
      create: {
        userId: session.user.id,
        endpoint: storedSubscription.endpoint,
        p256dh: storedSubscription.p256dh,
        auth: storedSubscription.auth,
      },
      update: {
        userId: session.user.id,
        p256dh: storedSubscription.p256dh,
        auth: storedSubscription.auth,
      },
    });

    await prisma.restTimer.upsert({
      where: { userId_token: { userId: session.user.id, token } },
      create: { userId: session.user.id, token },
      update: {},
    });

    const client = new Client({ token: qstashToken });
    const headers: Record<string, string> = {};
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) headers["x-vercel-protection-bypass"] = bypass;

    const name =
      typeof exerciseName === "string" && exerciseName.trim()
        ? exerciseName.trim().slice(0, 80)
        : "je oefening";

    await client.publishJSON({
      url: `${origin}/api/rest-timer/send`,
      body: {
        exerciseName: name,
        planId: typeof planId === "string" && planId ? planId : null,
        userId: session.user.id,
        token,
      },
      delay: restDelaySeconds(delaySeconds),
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij QStash delay request:", error);
    return NextResponse.json({ error: "Kon timer niet inplannen" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { token } = await req.json();
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Geen timer" }, { status: 400 });
    }

    await prisma.restTimer.deleteMany({
      where: { userId: session.user.id, token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij annuleren rustmelding:", error);
    return NextResponse.json({ error: "Kon melding niet annuleren" }, { status: 500 });
  }
}
