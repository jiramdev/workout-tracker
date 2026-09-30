// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { subscription, delaySeconds, exerciseName, planId } = await req.json();

    if (!subscription) {
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

    await client.publishJSON({
      url: `${appUrl}/api/rest-timer/send`,
      body: {
        subscription,
        exerciseName: exerciseName || "je oefening",
        planId: planId || null,
      },
      delay: Math.max(1, delaySeconds || 90),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij QStash delay request:", error);
    return NextResponse.json({ error: "Kon timer niet inplannen" }, { status: 500 });
  }
}