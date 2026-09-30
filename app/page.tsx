// app/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboard } from "@/lib/queries";
import Prefetch from "@/components/Prefetch";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import prisma from "@/lib/prisma";

const dayNamesNL = [
  "ZONDAG",
  "MAANDAG",
  "DINSDAG",
  "WOENSDAG",
  "DONDERDAG",
  "VRIJDAG",
  "ZATERDAG",
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [{ todayPlan, latestWeight, trainedDaysCount, dayOfWeek, profileName, profileEmail }, unreadCount] =
    await Promise.all([
      getDashboard(session.user.id),
      prisma.appNotification.count({
        where: { userId: session.user.id, read: false, title: { not: "Rust voorbij" } },
      }),
    ]);

  const displayName = profileName || profileEmail?.split("@")[0] || "ATHLETE";
  const userInitial = displayName.charAt(0).toUpperCase();
  const workoutHref = todayPlan ? `/workout/active?planId=${todayPlan.id}` : "/schedule";

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <Prefetch hrefs={[workoutHref, "/account", "/notifications"]} />
      <main className="max-w-sm mx-auto space-y-3.5">
        {/* Top Header: Account Pill links & Instellingen rechts */}
        <header className="flex justify-between items-center px-1 py-1">
          {/* Pill knop naar Account met avatar */}
          <Link
            href="/account"
            prefetch={true}
            className="h-10 bg-[#141416] border border-white/[0.08] pl-1.5 pr-4 rounded-full flex items-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition apple-press"
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={displayName}
                className="w-7 h-7 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#baa3d0] text-[#141416] flex items-center justify-center font-bold text-[12px] uppercase">
                {userInitial}
              </div>
            )}
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              {displayName}
            </span>
          </Link>

          <Link
            href="/notifications"
            prefetch={true}
            aria-label="Meldingen"
            className="relative w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <Bell className="w-4 h-4 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#baa3d0]" />
            )}
          </Link>
        </header>

        {/* 1. Hero Workout Card */}
        <Link
          href={workoutHref}
          prefetch={true}
          className="block bg-[#141416] border border-white/[0.08] rounded-[34px] px-6 py-9 text-center space-y-3 relative overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.25)] transition apple-press"
        >
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#baa3d0] uppercase">
            {dayNamesNL[dayOfWeek]}
          </p>

          <h1 className="text-[52px] sm:text-[58px] font-editorial tracking-tight text-white leading-none">
            {todayPlan ? todayPlan.name : "REST DAY"}
          </h1>

          <p className="text-[14px] text-[#a1a1aa] font-medium tracking-tight">
            {todayPlan
              ? `${todayPlan.exerciseCount} oefeningen ingepland`
              : "Geen training ingeroosterd"}
          </p>
        </Link>

        {/* 2. Twee Widgets: Sessies & Gewicht */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Widget Links: Sessies */}
          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Sessies
            </span>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {trainedDaysCount}
              </span>
            </div>

            <span className="text-[12px] text-[#a1a1aa] font-medium">
              deze maand
            </span>
          </div>

          {/* Widget Rechts: Gewicht */}
          <Link
            href="/account"
            prefetch={true}
            className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition apple-press"
          >
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Gewicht
            </span>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {latestWeight ?? "--"}
              </span>
            </div>

            <span className="text-[12px] text-[#a1a1aa] font-medium">
              kilo
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}