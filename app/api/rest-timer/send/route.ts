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
      return NextResponse.json({ error: "VAPID niet ingesteld" }, { status: 500 });
    }

    const { subscription, exerciseName } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: "Geen subscription" }, { status: 400 });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: "Rust voorbij ⚡️",
      body: `Tijd voor je volgende set van ${exerciseName}!`,
      url: "/workout/active",
    });

    // Stuurt via Apple APNs direct naar je iPhone lockscreen
    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij verzenden push via APNs:", error);
    return NextResponse.json({ error: "Push mislukt" }, { status: 500 });
  }
}