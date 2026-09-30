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
      console.error("QSTASH_TOKEN ontbreekt in environment variables.");
      return NextResponse.json({ error: "QStash token ontbreekt" }, { status: 500 });
    }

    const client = new Client({ token: qstashToken });

    // Bepaal de live URL van je Vercel app
    const appUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Geef QStash de opdracht om over X seconden onze verzend-webhook aan te roepen
    await client.publishJSON({
      url: `${appUrl}/api/rest-timer/send`,
      body: {
        subscription,
        exerciseName: exerciseName || "je oefening",
      },
      delay: Math.max(1, delaySeconds || 90),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij QStash delay request:", error);
    return NextResponse.json({ error: "Kon timer niet inplannen" }, { status: 500 });
  }
}