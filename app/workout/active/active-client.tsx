// app/workout/active/active-client.tsx
"use client";

import { useState, useEffect } from "react";
import { finishWorkout } from "@/app/actions/workout";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Timer, ChevronRight } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  restSeconds: number;
}

interface Plan {
  id: string;
  name: string;
  exercises: Exercise[];
}

interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export default function ActiveWorkoutClient({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [logs, setLogs] = useState<Record<string, SetLog[]>>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, SetLog[]> = {};
    plan.exercises.forEach((ex) => {
      initial[ex.id] = Array.from({ length: ex.targetSets }, () => ({
        reps: 0,
        weight: 0,
        completed: false,
      }));
    });
    setLogs(initial);
  }, [plan]);

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  function updateSet(
    exerciseId: string,
    setIdx: number,
    field: "reps" | "weight",
    value: number
  ) {
    setLogs((prev) => {
      const exerciseSets = prev[exerciseId] ? [...prev[exerciseId]] : [];
      exerciseSets[setIdx] = {
        ...exerciseSets[setIdx],
        [field]: value,
      };
      return { ...prev, [exerciseId]: exerciseSets };
    });
  }

  function toggleSetComplete(exerciseId: string, setIdx: number, restSeconds: number) {
    setLogs((prev) => {
      const exerciseSets = [...(prev[exerciseId] || [])];
      const isCompleted = !exerciseSets[setIdx]?.completed;
      exerciseSets[setIdx] = {
        ...exerciseSets[setIdx],
        completed: isCompleted,
      };

      if (isCompleted && restSeconds > 0) {
        setRestTimer(restSeconds);
      }

      return { ...prev, [exerciseId]: exerciseSets };
    });
  }

  async function handleFinish() {
    setSaving(true);
    const formatted = plan.exercises.map((ex) => ({
      name: ex.name,
      sets: (logs[ex.id] || []).map((s, idx) => ({
        setNumber: idx + 1,
        reps: Number(s.reps) || 0,
        weight: Number(s.weight) || 0,
      })),
    }));

    await finishWorkout(plan.id, formatted);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-36">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#f5f5f7]/85 backdrop-blur-xl border-b border-[#e5e5ea]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[14px] text-[#7a7a7a] hover:text-[#1d1d1f] transition"
          >
            <X className="w-4 h-4" />
            <span>Afbreken</span>
          </Link>
          <span className="font-semibold text-[17px] text-[#1d1d1f]">
            {plan.name}
          </span>
          <span className="w-16 text-right text-[12px] font-medium text-[#0066cc]">
            Actief
          </span>
        </div>
      </header>

      {/* Floating Apple-Style Rest Pill */}
      {restTimer !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f]/90 text-white backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 border border-white/10 animate-fade-in">
          <Timer className="w-4 h-4 text-[#2997ff]" />
          <span className="text-[14px] font-medium font-mono">
            Rusttijd: <strong className="text-white">{restTimer}s</strong>
          </span>
          <button
            onClick={() => setRestTimer(null)}
            className="text-[12px] text-[#cccccc] hover:text-white border-l border-white/20 pl-2 transition"
          >
            Overslaan
          </button>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {plan.exercises.map((exercise) => {
          const sets = logs[exercise.id] || [];
          return (
            <div
              key={exercise.id}
              className="bg-[#ffffff] border border-[#e5e5ea] rounded-[18px] p-5 sm:p-6 space-y-4"
            >
              <div className="flex justify-between items-baseline">
                <h3 className="text-[19px] font-semibold text-[#1d1d1f] tracking-[-0.374px]">
                  {exercise.name}
                </h3>
                <span className="text-[13px] text-[#7a7a7a]">
                  {exercise.restSeconds}s rust
                </span>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider px-2">
                  <span className="col-span-2">Set</span>
                  <span className="col-span-4 text-center">Kg</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-right">Klaar</span>
                </div>

                {sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-[11px] transition ${
                      set.completed
                        ? "bg-[#f5f5f7] border border-transparent"
                        : "bg-[#ffffff] border border-[#e5e5ea]"
                    }`}
                  >
                    <span className="col-span-2 font-mono text-[14px] font-semibold text-[#7a7a7a] pl-2">
                      #{sIdx + 1}
                    </span>

                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        step="0.5"
                        onChange={(e) =>
                          updateSet(
                            exercise.id,
                            sIdx,
                            "weight",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full text-center py-2 bg-transparent text-[#1d1d1f] font-semibold text-[16px] focus:outline-none placeholder-[#cccccc]"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        onChange={(e) =>
                          updateSet(
                            exercise.id,
                            sIdx,
                            "reps",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full text-center py-2 bg-transparent text-[#1d1d1f] font-semibold text-[16px] focus:outline-none placeholder-[#cccccc]"
                      />
                    </div>

                    <div className="col-span-2 flex justify-end pr-1">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSetComplete(
                            exercise.id,
                            sIdx,
                            exercise.restSeconds
                          )
                        }
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition apple-btn-active ${
                          set.completed
                            ? "bg-[#0066cc] text-white shadow-sm"
                            : "bg-[#f5f5f7] text-[#7a7a7a] hover:bg-[#e5e5ea]"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Voltooien CTA */}
        <div className="pt-4">
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full py-[14px] bg-[#0066cc] hover:bg-[#0071e3] text-white font-normal text-[17px] rounded-full transition apple-btn-active disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{saving ? "Opslaan..." : "Workout Voltooien"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}