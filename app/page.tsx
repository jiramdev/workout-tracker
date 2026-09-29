// app/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, ArrowUpRight, Check, Dumbbell } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Zo, 1 = Ma...
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

  const monthNamesNL = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
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

  // 3. Maandstatistieken (aantal getrainde dagen)
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const monthlyLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
      completedAt: { gte: startOfMonth },
    },
    include: { entries: true },
  });

  const trainedDaysCount = new Set(
    monthlyLogs
      .filter((l) => l.completedAt)
      .map((l) => new Date(l.completedAt!).getDate())
  ).size;

  // 4. Afgelopen 3 trainingen
  const pastWorkouts = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    take: 3,
    include: {
      plan: true,
      entries: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        
        {/* Top Minimalistic Navigation */}
        <header className="flex justify-between items-center px-1 py-1">
          <Link
            href="/schedule"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press"
          >
            <Calendar className="w-4 h-4 stroke-[1.8]" />
          </Link>

          <span className="text-[12px] font-semibold tracking-widest text-[#141416] uppercase bg-white/30 backdrop-blur-md px-4 py-1.5 rounded-full">
            Workout Tracker
          </span>

          <Link
            href="/weight/log"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#baa3d0] font-mono text-[12px] font-bold transition apple-press"
          >
            {latestWeight ? Math.round(latestWeight.weight) : "--"}
          </Link>
        </header>

        {/* 1. HERO WORKOUT CARD: Grote Gecentreerde Typografie */}
        <Link
          href={todayPlan ? `/workout/active?planId=${todayPlan.id}` : "/schedule"}
          className="block bg-[#141416] border border-white/[0.08] rounded-[34px] px-6 py-9 text-center space-y-3 relative overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.25)] transition apple-press group"
        >
          {/* Dagindicator gecentreerd */}
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#baa3d0] uppercase">
            {dayNamesNL[currentDayOfWeek]}
          </p>

          {/* Enorme Workout Titel */}
          <h1 className="text-[52px] sm:text-[58px] font-editorial tracking-tight text-white leading-none">
            {todayPlan ? todayPlan.name : "REST DAY"}
          </h1>

          {/* Aantal oefeningen gecentreerd onder de titel */}
          <p className="text-[14px] text-[#a1a1aa] font-medium tracking-tight">
            {todayPlan
              ? `${todayPlan.exercises.length} oefeningen ingepland`
              : "Geen training ingeroosterd"}
          </p>
        </Link>

        {/* 2. STATS & CONTEXT CARD: Gecentreerde Editorial Paragraaf */}
        <div className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-7 text-center space-y-4 shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
          {/* Subtiele badge row gecentreerd */}
          <div className="flex justify-center items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#baa3d0]">
            <span>{monthNamesNL[currentMonth]}</span>
            <span>•</span>
            <span>{trainedDaysCount} Dagen Actief</span>
          </div>

          {/* Gecentreerde typografische statement paragraaf */}
          <p className="text-[17px] font-medium leading-[1.45] text-[#d4d4d8] tracking-tight">
            Je weegt momenteel{" "}
            <span className="text-white font-bold underline decoration-[#baa3d0] underline-offset-4">
              {latestWeight ? `${latestWeight.weight} kg` : "onbekend"}
            </span>
            . Deze maand heb je inmiddels{" "}
            <span className="text-white font-bold">{trainedDaysCount} sessies</span>{" "}
            voltooid. Blijf consistent bouwen aan je progressieve overload.
          </p>
        </div>

        {/* 3. RECENTE SESSIES: Witte Contrast Kaart (zoals onderin de mock-up) */}
        <section className="bg-white text-black rounded-[34px] p-6 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
            <div>
              <h2 className="text-[18px] font-bold text-black tracking-tight leading-none">
                Afgelopen Trainingen
              </h2>
              <p className="text-[12px] text-[#71717a] mt-1">
                Laatste {pastWorkouts.length} voltooide sessies
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
          </div>

          <div className="space-y-2.5">
            {pastWorkouts.length === 0 ? (
              <p className="text-center py-4 text-[13px] text-[#71717a]">
                Nog geen afgeronde trainingen gelogd.
              </p>
            ) : (
              pastWorkouts.map((workout) => {
                const dateStr = workout.completedAt
                  ? new Date(workout.completedAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Onbekend";

                const totalSets = workout.entries.length;
                const totalKg = workout.entries.reduce(
                  (sum, e) => sum + e.weight * e.reps,
                  0
                );

                return (
                  <div
                    key={workout.id}
                    className="bg-[#f4f4f5] rounded-[22px] px-4 py-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#141416] text-white flex items-center justify-center">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-[14px] tracking-tight block text-black">
                          {workout.plan?.name || "Vrije Workout"}
                        </span>
                        <span className="text-[11px] text-[#71717a]">
                          {dateStr} • {totalSets} sets
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-[12px] font-semibold bg-white px-2.5 py-1 rounded-full border border-black/[0.06] text-black">
                      {totalKg > 0 ? `${Math.round(totalKg)} kg` : "--"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}