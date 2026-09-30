import { Trophy } from "lucide-react";
import AnalyticsChart from "@/app/analytics/AnalyticsChart";

type Workout = {
  completedAt: string;
  entries: { exerciseName: string; weight: number; reps: number }[];
};

type WeightLog = { weight: number; loggedAt: string };

export default function AnalyticsPanel({
  workouts,
  weightLogs,
}: {
  workouts: Workout[];
  weightLogs: WeightLog[];
}) {
  const totalWorkouts = workouts.length;
  const strengthChartPoints: Array<{ date: string; value: number }> = [];
  const exerciseMaxMap = new Map<string, number>();

  workouts.forEach((workout) => {
    let sessionBestE1RM = 0;

    workout.entries.forEach((entry) => {
      if (entry.weight <= 0) return;
      const e1rm = entry.reps > 1 ? entry.weight * (1 + entry.reps / 30) : entry.weight;
      if (e1rm > sessionBestE1RM) sessionBestE1RM = e1rm;

      const name = entry.exerciseName || "Oefening";
      const currentMax = exerciseMaxMap.get(name) || 0;
      if (entry.weight > currentMax) exerciseMaxMap.set(name, entry.weight);
    });

    if (workout.completedAt && sessionBestE1RM > 0) {
      strengthChartPoints.push({
        date: new Date(workout.completedAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "short",
        }),
        value: Math.round(sessionBestE1RM),
      });
    }
  });

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

  const topPRs = Array.from(exerciseMaxMap.entries())
    .map(([name, weight]) => ({ name, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const weightChartPoints = weightLogs.map((log) => ({
    date: new Date(log.loggedAt).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    }),
    value: Number(log.weight.toFixed(1)),
  }));

  return (
    <div className="min-h-screen bg-[#baa3d0] text-white pb-32 pt-4 px-4 select-none">
      <main className="max-w-sm mx-auto space-y-3.5">
        <header className="flex items-center px-1 py-1">
          <div className="h-10 bg-[#141416] border border-white/[0.08] px-4 rounded-full flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#baa3d0]" />
            <span className="font-editorial text-[14px] tracking-wider text-white leading-none uppercase">
              STATISTIEKEN
            </span>
          </div>
        </header>

        <AnalyticsChart weightPoints={weightChartPoints} strengthPoints={strengthChartPoints} />

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Sessies
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {totalWorkouts}
              </span>
            </div>
            <span className="text-[12px] text-[#a1a1aa] font-medium">voltooid</span>
          </div>

          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Kracht
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {strengthGainStr}
              </span>
            </div>
            <span className="text-[12px] text-[#a1a1aa] font-medium">totale winst</span>
          </div>
        </div>

        {topPRs.length > 0 && (
          <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
                Zwaarste Lifts (PR)
              </span>
              <Trophy className="w-3.5 h-3.5 text-[#baa3d0]" />
            </div>
            <div className="space-y-2 pt-1">
              {topPRs.map((pr) => (
                <div
                  key={pr.name}
                  className="bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between border border-white/[0.04]"
                >
                  <span className="text-[14px] font-medium text-white">{pr.name}</span>
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
