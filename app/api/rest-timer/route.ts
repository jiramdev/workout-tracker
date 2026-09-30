// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { subscription, delaySeconds, exerciseName } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: "Geen subscription meegegeven" }, { status: 400 });
    }

    // Wacht tot de rusttijd voorbij is en stuur dan de push
    setTimeout(async () => {
      const payload = JSON.stringify({
        title: "Rust voorbij ⚡️",
        body: `Tijd voor je volgende set van ${exerciseName || "je oefening"}!`,
        url: "/workout/active",
      });

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error("Fout bij verzenden push:", err);
      }
    }, (delaySeconds || 90) * 1000);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}