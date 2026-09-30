// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Client } from "@upstash/qstash";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { subscription, delaySeconds, exerciseName, planId, token } = await req.json();

    if (!subscription || typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Geen subscription" }, { status: 400 });
    }

    const qstashToken = process.env.QSTASH_TOKEN;
    if (!qstashToken) {
      console.error("QSTASH_TOKEN ontbreekt");
      return NextResponse.json({ error: "QStash token ontbreekt" }, { status: 500 });
    }

    const client = new Client({ token: qstashToken });

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const appUrl = `${protocol}://${host}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { restMessageId: token },
    });

    await client.publishJSON({
      url: `${appUrl}/api/rest-timer/send`,
      body: {
        subscription,
        exerciseName: exerciseName || "je oefening",
        planId: planId || null,
        userId: session.user.id,
        token,
      },
      delay: Math.max(1, delaySeconds || 90),
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

    await prisma.user.updateMany({
      where: { id: session.user.id, restMessageId: token },
      data: { restMessageId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij annuleren rustmelding:", error);
    return NextResponse.json({ error: "Kon melding niet annuleren" }, { status: 500 });
  }
}