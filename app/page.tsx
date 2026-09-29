// app/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const dayNamesNL = [
    "ZONDAG",
    "MAANDAG",
    "DINSDAG",
    "WOENSDAG",
    "DONDERDAG",
    "VRIJDAG",
    "ZATERDAG",
  ];

  // 1. Plan van vandaag
  const scheduleDay = await prisma.scheduleDay.findFirst({
    where: {
      schedule: { userId: session.user.id },
      dayOfWeek: currentDayOfWeek,
    },
    include: {
      plan: {
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });

  const todayPlan = scheduleDay?.plan;

  // 2. Lichaamsgewicht
  const latestWeight = await prisma.bodyWeightLog.findFirst({
    where: { userId: session.user.id },
    orderBy: { loggedAt: "desc" },
  });

  // 3. Maandsessies tellen
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const monthlyLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
      completedAt: { gte: startOfMonth },
    },
    select: { completedAt: true },
  });

  const trainedDaysCount = new Set(
    monthlyLogs
      .filter((l) => l.completedAt)
      .map((l) => new Date(l.completedAt!).getDate())
  ).size;

  const displayName = session.user.name || session.user.email?.split("@")[0] || "ATHLETE";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        {/* Top Header: Account Pill links & Instellingen rechts */}
        <header className="flex justify-between items-center px-1 py-1">
          {/* Pill knop naar Account met avatar */}
          <Link
            href="/account"
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

          {/* Rechts: Instellingen */}
          <Link
            href="/settings"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <Settings className="w-4 h-4 stroke-[1.8]" />
          </Link>
        </header>

        {/* 1. Hero Workout Card */}
        <Link
          href={todayPlan ? `/workout/active?planId=${todayPlan.id}` : "/schedule"}
          className="block bg-[#141416] border border-white/[0.08] rounded-[34px] px-6 py-9 text-center space-y-3 relative overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.25)] transition apple-press"
        >
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#baa3d0] uppercase">
            {dayNamesNL[currentDayOfWeek]}
          </p>

          <h1 className="text-[52px] sm:text-[58px] font-editorial tracking-tight text-white leading-none">
            {todayPlan ? todayPlan.name : "REST DAY"}
          </h1>

          <p className="text-[14px] text-[#a1a1aa] font-medium tracking-tight">
            {todayPlan
              ? `${todayPlan.exercises.length} oefeningen ingepland`
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
            href="/weight/log"
            className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition apple-press"
          >
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Gewicht
            </span>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {latestWeight ? latestWeight.weight : "--"}
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