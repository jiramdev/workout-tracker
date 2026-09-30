// app/api/rest-timer/send/route.ts
import { NextResponse } from "next/server";
import webpush from "web-push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:marijn.snoeren@gmail.com";

    if (!publicKey || !privateKey) {
      console.error("VAPID keys niet geconfigureerd");
      return NextResponse.json({ error: "VAPID niet ingesteld" }, { status: 500 });
    }

    const { subscription, exerciseName } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Ongeldige subscription ontvangen" }, { status: 400 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: "Rust voorbij ⚡️",
      body: `Tijd voor je volgende set van ${exerciseName || "je oefening"}!`,
      url: "/workout/active",
    });

    console.log("[Push Send] Notificatie verzenden naar APNs endpoint...");

    // Stuur met high urgency zodat Apple hem direct op de lockscreen gooit
    await webpush.sendNotification(subscription, payload, {
      urgency: "high",
      TTL: 60,
    });

    console.log("[Push Send] Notificatie succesvol afgeleverd aan push server!");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fout bij verzenden push via APNs:", error?.body || error?.message || error);
    return NextResponse.json({ error: "Push mislukt", details: String(error) }, { status: 500 });
  }
}