// app/workout/active/active-client.tsx
"use client";

import { useState, useEffect } from "react";
import { finishWorkout } from "@/app/actions/workout";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // Initialiseer lege sets voor alle oefeningen
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

  // Rust-countdown timer
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-32 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white">
            ✕ Afbreken
          </Link>
          <h1 className="text-2xl font-extrabold mt-1">{plan.name}</h1>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold animate-pulse">
          ● Live Sessie
        </span>
      </div>

      {/* Zwevende rusttimer onderaan als hij aftelt */}
      {restTimer !== null && (
        <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto bg-zinc-900 border border-zinc-700 p-4 rounded-2xl shadow-2xl flex items-center justify-between z-50">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
              Rusttimer
            </p>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              {restTimer}s
            </p>
          </div>
          <button
            onClick={() => setRestTimer(null)}
            className="px-3 py-1.5 bg-zinc-800 text-xs font-semibold rounded-lg hover:bg-zinc-700"
          >
            Overslaan
          </button>
        </div>
      )}

      {/* Oefeningen lijst */}
      <div className="space-y-4">
        {plan.exercises.map((exercise) => {
          const sets = logs[exercise.id] || [];
          return (
            <div
              key={exercise.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-white">{exercise.name}</h3>
                <span className="text-xs text-zinc-400">
                  {exercise.restSeconds}s rust
                </span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 uppercase px-1">
                  <span className="col-span-2 text-center">Set</span>
                  <span className="col-span-4 text-center">Kg</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-center">Gereed</span>
                </div>

                {sets.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition ${
                      set.completed
                        ? "bg-emerald-950/30 border border-emerald-900/50"
                        : "bg-zinc-800/60"
                    }`}
                  >
                    <span className="col-span-2 text-center font-bold text-sm text-zinc-400">
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
                        className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:border-zinc-400"
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
                        className="w-full text-center py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-semibold focus:outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSetComplete(
                            exercise.id,
                            sIdx,
                            exercise.restSeconds
                          )
                        }
                        className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition cursor-pointer ${
                          set.completed
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-center text-lg shadow-xl shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
      >
        {saving ? "Opslaan in database..." : "Workout Voltooien & Opslaan 🚀"}
      </button>
    </main>
  );
}