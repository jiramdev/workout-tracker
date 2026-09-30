// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { subscription, delaySeconds, exerciseName } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: "Geen subscription" }, { status: 400 });
    }

    const qstashToken = process.env.QSTASH_TOKEN;
    if (!qstashToken) {
      console.error("QSTASH_TOKEN ontbreekt");
      return NextResponse.json({ error: "QStash token ontbreekt" }, { status: 500 });
    }

    const client = new Client({ token: qstashToken });

    // Haal het ECHTE publieke domein dynamisch op van het inkomende request
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const appUrl = `${protocol}://${host}`;

    console.log(`[QStash Schedule] Callback URL ingesteld op: ${appUrl}/api/rest-timer/send`);

    await client.publishJSON({
      url: `${appUrl}/api/rest-timer/send`,
      body: {
        subscription,
        exerciseName: exerciseName || "je oefening",
      },
      delay: Math.max(1, delaySeconds || 90),
    });

    return NextResponse.json({ success: true, target: `${appUrl}/api/rest-timer/send` });
  } catch (error) {
    console.error("Fout bij QStash delay request:", error);
    return NextResponse.json({ error: "Kon timer niet inplannen" }, { status: 500 });
  }
}