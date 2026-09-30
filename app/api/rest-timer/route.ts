// app/api/rest-timer/route.ts
import { NextResponse } from "next/server";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

    // Als keys ontbreken op de server, geef een nette 200/500 zonder de build te breken
    if (!publicKey || !privateKey) {
      console.warn("VAPID keys ontbreken in environment variables.");
      return NextResponse.json(
        { error: "VAPID keys niet geconfigureerd" },
        { status: 500 }
      );
    }

    const { subscription, delaySeconds, exerciseName } = await req.json();

    if (!subscription) {
      return NextResponse.json(
        { error: "Geen subscription meegegeven" },
        { status: 400 }
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    // Voer de delay uit en stuur de push
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