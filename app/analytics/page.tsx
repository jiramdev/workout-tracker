// app/analytics/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import AnalyticsChart from "./AnalyticsChart";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // 1. Workouts ophalen (chronologisch)
  const workouts = await prisma.workoutLog.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    include: {
      entries: true,
      plan: true,
    },
    orderBy: { completedAt: "asc" },
  });

  const totalWorkouts = workouts.length;

  // 2. Krachtformule berekenen (Epley e1RM piek per sessie)
  // Formule: gewicht * (1 + reps / 30)
  const strengthChartPoints: Array<{ date: string; value: number }> = [];
  const exerciseMaxMap = new Map<string, number>();

  workouts.forEach((w) => {
    let sessionBestE1RM = 0;

    w.entries.forEach((e) => {
      const e1rm = e.reps > 1 ? e.weight * (1 + e.reps / 30) : e.weight;
      if (e1rm > sessionBestE1RM) {
        sessionBestE1RM = e1rm;
      }

      const exName = (e as any).exerciseName || "Oefening";
      const currentMax = exerciseMaxMap.get(exName) || 0;
      if (e.weight > currentMax) {
        exerciseMaxMap.set(exName, e.weight);
      }
    });

    if (w.completedAt && sessionBestE1RM > 0) {
      strengthChartPoints.push({
        date: new Date(w.completedAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "short",
        }),
        value: Math.round(sessionBestE1RM),
      });
    }
  });

  // Bereken totale krachtprogressie (% toename eerste vs laatste workout)
  let strengthGainStr = "--";
  if (strengthChartPoints.length >= 2) {
    const firstScore = strengthChartPoints[0].value;
    const lastScore = strengthChartPoints[strengthChartPoints.length - 1].value;
    if (firstScore > 0) {
      const gainPercent = Math.round(((lastScore - firstScore) / firstScore) * 100);
      strengthGainStr = gainPercent >= 0 ? `+${gainPercent}%` : `${gainPercent}%`;
    }
  } else if (strengthChartPoints.length === 1) {
    strengthGainStr = "0%";
  }

  // Top PR's
  const topPRs = Array.from(exerciseMaxMap.entries())
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  // 3. Lichaamsgewicht progressie
  const weightLogs = await prisma.bodyWeightLog.findMany({
    where: { userId },
    orderBy: { loggedAt: "asc" },
  });

  const weightChartPoints = weightLogs.map((log) => ({
    date: new Date(log.loggedAt).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    }),
    value: Number(log.weight.toFixed(1)),
  }));

  const firstWeight = weightLogs[0]?.weight ?? null;
  const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? null;

  let deltaStr = "--";
  if (firstWeight !== null && currentWeight !== null && weightLogs.length > 1) {
    const diff = Number((currentWeight - firstWeight).toFixed(1));
    deltaStr = diff > 0 ? `+${diff}` : `${diff}`;
  } else if (currentWeight !== null) {
    deltaStr = "0.0";
  }

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        
        {/* Top Header: Terug links, Titel pill rechts */}
        <header className="flex justify-between items-center px-1 py-1">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-[#141416] border border-white/[0.08] flex items-center justify-center text-[#a1a1aa] hover:text-white transition apple-press shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </Link>

          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              STATISTIEKEN
            </span>
          </div>
        </header>

        {/* 1. Visuele Kracht- & Gewichtscurve */}
        <AnalyticsChart
          weightPoints={weightChartPoints}
          strengthPoints={strengthChartPoints}
        />

        {/* 2. De 2 Kernstatistieken: Workouts & Krachtprogressie */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Totaal sessies */}
          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Sessies
            </span>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {totalWorkouts}
              </span>
            </div>

            <span className="text-[12px] text-[#a1a1aa] font-medium">
              voltooid
            </span>
          </div>

          {/* Krachtgroei Percentage */}
          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Kracht
            </span>

            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {strengthGainStr}
              </span>
            </div>

            <span className="text-[12px] text-[#a1a1aa] font-medium">
              totale winst
            </span>
          </div>
        </div>

        {/* 3. Persoonlijke Records (De Zwaarste Lifts) */}
        {topPRs.length > 0 && (
          <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
                Zwaarste Lifts (PR)
              </span>
              <Trophy className="w-3.5 h-3.5 text-[#baa3d0]" />
            </div>

            <div className="space-y-2 pt-1">
              {topPRs.map((pr, idx) => (
                <div
                  key={idx}
                  className="bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between border border-white/[0.04]"
                >
                  <span className="text-[14px] font-medium text-white">
                    {pr.name}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-editorial text-[22px] text-[#baa3d0] tracking-wider leading-none">
                      {pr.weight}
                    </span>
                    <span className="text-[11px] text-[#71717a] font-medium">kg</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}