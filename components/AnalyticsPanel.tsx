import { Trophy } from "lucide-react";
import MonthCalendar from "@/components/MonthCalendar";

const TZ = "Europe/Amsterdam";

function dateKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

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
  const workoutDates = workouts.map((workout) => dateKey(workout.completedAt));
  const todayKey = dateKey(new Date().toISOString());
  const exerciseMaxMap = new Map<string, { weight: number; reps: number }>();

  workouts.forEach((workout) => {
    workout.entries.forEach((entry) => {
      if (entry.weight <= 0) return;
      const name = entry.exerciseName || "Oefening";
      const current = exerciseMaxMap.get(name);
      if (!current || entry.weight > current.weight || (entry.weight === current.weight && entry.reps > current.reps)) {
        exerciseMaxMap.set(name, { weight: entry.weight, reps: entry.reps });
      }
    });
  });

  const topPRs = Array.from(exerciseMaxMap.entries())
    .map(([name, best]) => ({ name, ...best }))
    .sort((a, b) => b.weight - a.weight || b.reps - a.reps);

  const latestWeight = weightLogs.at(-1)?.weight;

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

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 text-center flex flex-col justify-between items-center aspect-square shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              Gewicht
            </span>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[48px] font-editorial tracking-tight text-white leading-none block">
                {latestWeight == null ? "--" : Number(latestWeight.toFixed(1))}
              </span>
            </div>
            <span className="text-[12px] text-[#a1a1aa] font-medium">kilo</span>
          </div>

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
        </div>

        <MonthCalendar workoutDates={workoutDates} todayKey={todayKey} />

        <section className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
              PRs
            </span>
            <Trophy className="w-3.5 h-3.5 text-[#baa3d0]" />
          </div>
          {topPRs.length === 0 ? (
            <div className="bg-[#1b1b1e] rounded-2xl px-4 py-3 border border-white/[0.04]">
              <span className="text-[14px] font-medium text-[#71717a]">Nog geen PRs</span>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {topPRs.map((pr) => (
                <div
                  key={pr.name}
                  className="bg-[#1b1b1e] rounded-2xl px-4 py-3 flex items-center justify-between gap-3 border border-white/[0.04]"
                >
                  <span className="text-[14px] font-medium text-white truncate">{pr.name}</span>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="font-editorial text-[22px] text-[#baa3d0] tracking-wider leading-none">
                      {pr.weight}
                    </span>
                    <span className="text-[11px] text-[#71717a] font-medium">kg</span>
                    <span className="text-[11px] text-[#71717a] font-medium">× {pr.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
