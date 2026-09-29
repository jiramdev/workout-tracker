// app/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SlidersHorizontal, ArrowRight, Dumbbell } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const now = new Date();
  const todayIndex = now.getDay();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // 1. Plan van vandaag
  const scheduleDay = await prisma.scheduleDay.findFirst({
    where: {
      schedule: { userId: session.user.id },
      dayOfWeek: todayIndex,
    },
    include: {
      plan: {
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });

  const todayPlan = scheduleDay?.plan;

  // 2. Laatste lichaamsgewicht
  const latestWeight = await prisma.bodyWeightLog.findFirst({
    where: { userId: session.user.id },
    orderBy: { loggedAt: "desc" },
  });

  let weightTimeAgo = "Geen meting";
  if (latestWeight) {
    const diffMin = Math.floor(
      (now.getTime() - new Date(latestWeight.loggedAt).getTime()) / (1000 * 60)
    );
    if (diffMin < 60) weightTimeAgo = `${Math.max(1, diffMin)} min ago`;
    else if (diffMin < 1440) weightTimeAgo = `${Math.floor(diffMin / 60)}h ago`;
    else weightTimeAgo = `${Math.floor(diffMin / 1440)}d ago`;
  }

  // 3. Maanddata & unieke trainingsdagen
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInCurrentMonth = endOfMonth.getDate();

  const monthlyLogs = await prisma.workoutLog.findMany({
    where: {
      userId: session.user.id,
      completedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: { completedAt: true },
  });

  const trainedDaysSet = new Set(
    monthlyLogs
      .filter((l) => l.completedAt)
      .map((l) => new Date(l.completedAt!).getDate())
  );

  const trainedDaysCount = trainedDaysSet.size;

  // 4. Afgelopen 3 workouts ophalen
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
    <div className="min-h-screen bg-black text-white pb-32 pt-8 select-none">
      <main className="max-w-md mx-auto px-5 space-y-4">
        {/* Header zonder + knoppen */}
        <header className="flex justify-between items-center pt-2 pb-1">
          <h1 className="text-[34px] font-bold tracking-tight text-white">
            Workouts
          </h1>
          <Link
            href="/schedule"
            className="w-10 h-10 rounded-full bg-[#1c1c1e] flex items-center justify-center text-white hover:bg-[#2c2c2e] transition apple-press"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.75]" />
          </Link>
        </header>

        {/* 1. Full-Width Workout van de Dag Widget */}
        <Link
          href={todayPlan ? `/workout/active?planId=${todayPlan.id}` : "/schedule"}
          className="group block bg-[#1c1c1e] rounded-[26px] p-5 border border-white/[0.04] apple-press"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center relative">
                <span className="font-mono text-sm font-semibold text-white">
                  1
                </span>
                {todayPlan && (
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#2997ff]" />
                )}
              </div>
              <div>
                <span className="text-[12px] font-medium text-[#8e8e93] uppercase tracking-wider block">
                  {dayNames[todayIndex]}
                </span>
                <h2 className="text-[19px] font-bold text-white tracking-tight leading-snug">
                  {todayPlan ? todayPlan.name : "Rest Day"}
                </h2>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-[#2c2c2e]/60 flex items-center justify-center text-[#8e8e93] group-hover:text-white transition">
              <ArrowRight className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-white/[0.06] text-[13px] text-[#8e8e93]">
            <span>
              {todayPlan
                ? `${todayPlan.exercises.length} oefeningen gereed`
                : "Geen training ingepland"}
            </span>
            <span className="text-[#2997ff] font-medium">
              {todayPlan ? "Start sessie" : "Kies plan"}
            </span>
          </div>
        </Link>

        {/* 2. Twee Halve Pagina Widgets in Exact Dezelfde Kaartstijl */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Halve widget links: Consistentie & Maand Dots */}
          <div className="bg-[#1c1c1e] rounded-[26px] p-5 flex flex-col justify-between aspect-square border border-white/[0.04]">
            <div className="flex justify-between items-start">
              <span className="text-[12px] font-medium text-[#8e8e93] uppercase tracking-wider">
                {monthShort[currentMonth]}
              </span>
              <SlidersHorizontal className="w-4 h-4 text-[#8e8e93]" />
            </div>

            {/* Dots matrix */}
            <div className="grid grid-flow-col grid-rows-4 gap-x-2.5 gap-y-2 py-1 w-fit">
              {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                const dayNum = i + 1;
                const hasTrained = trainedDaysSet.has(dayNum);

                return (
                  <span
                    key={dayNum}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      hasTrained
                        ? "bg-white shadow-[0_0_5px_rgba(255,255,255,0.7)]"
                        : "bg-[#2c2c2e]"
                    }`}
                  />
                );
              })}
            </div>

            {/* Consistentie info met badge */}
            <div className="flex items-center gap-2.5 pt-2.5 border-t border-white/[0.06]">
              <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center font-mono text-[11px] text-white">
                {trainedDaysCount}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white tracking-tight leading-none">
                  {trainedDaysCount === 1 ? "1 Day" : `${trainedDaysCount} Days`}
                </p>
                <p className="text-[10px] text-[#8e8e93] mt-0.5">consistency</p>
              </div>
            </div>
          </div>

          {/* Halve widget rechts: Lichaamsgewicht */}
          <Link
            href="/weight/log"
            className="group bg-[#1c1c1e] rounded-[26px] p-5 flex flex-col justify-between aspect-square border border-white/[0.04] apple-press"
          >
            <div className="flex justify-end items-start">
              <SlidersHorizontal className="w-4 h-4 text-[#8e8e93]" />
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-[32px] font-semibold tracking-tight text-white leading-none">
                  {latestWeight ? latestWeight.weight : "--"}
                </span>
                <span className="text-[13px] text-[#8e8e93] font-normal">kg</span>
              </div>
              <p className="text-[14px] font-medium text-white mt-2">Body Weight</p>
              <p className="text-[11px] text-[#8e8e93]">{weightTimeAgo}</p>
            </div>
          </Link>
        </div>

        {/* 3. Past Workouts Balken */}
        <section className="pt-2 space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[15px] font-semibold text-[#8e8e93] uppercase tracking-wider">
              Past Workouts
            </h3>
            <span className="text-[12px] text-[#8e8e93]">Laatste 3</span>
          </div>

          {pastWorkouts.length === 0 ? (
            <div className="bg-[#1c1c1e] rounded-[22px] p-5 text-center text-[13px] text-[#8e8e93] border border-white/[0.04]">
              Nog geen voltooide workouts gelogd.
            </div>
          ) : (
            <div className="space-y-2">
              {pastWorkouts.map((workout) => {
                const workoutDate = workout.completedAt
                  ? new Date(workout.completedAt).toLocaleDateString("nl-NL", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Onbekend";

                const totalSets = workout.entries.length;
                const totalWeight = workout.entries.reduce(
                  (sum, e) => sum + e.weight * e.reps,
                  0
                );

                return (
                  <div
                    key={workout.id}
                    className="bg-[#1c1c1e] rounded-[20px] px-5 py-3.5 border border-white/[0.04] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-full bg-[#2c2c2e]/60 flex items-center justify-center text-[#8e8e93]">
                        <Dumbbell className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-white tracking-tight">
                          {workout.plan?.name || "Vrije Workout"}
                        </p>
                        <p className="text-[12px] text-[#8e8e93]">
                          {workoutDate} • {totalSets} sets
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[14px] font-semibold text-white">
                        {totalWeight > 0 ? `${totalWeight.toLocaleString("nl-NL")} kg` : "--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}