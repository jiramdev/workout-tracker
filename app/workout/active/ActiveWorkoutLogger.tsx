// app/workout/active/ActiveWorkoutLogger.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { finishWorkout } from "./actions";

interface Exercise {
  id: string;
  name: string;
  targetSets: number;
}

interface ActiveWorkoutLoggerProps {
  planId?: string | null;
  exercises: Exercise[];
  previousLogsMap: Record<string, { weight: number; reps: number }>;
}

interface SetRow {
  setNumber: number;
  weight: string;
  reps: string;
  isCompleted: boolean;
}

export default function ActiveWorkoutLogger({
  planId,
  exercises,
  previousLogsMap,
}: ActiveWorkoutLoggerProps) {
  const router = useRouter();
  const [startedAt] = useState<string>(new Date().toISOString());
  const [isFinishing, setIsFinishing] = useState(false);

  const [setsData, setSetsData] = useState<Record<string, SetRow[]>>(() => {
    const initial: Record<string, SetRow[]> = {};
    exercises.forEach((ex) => {
      const prev = previousLogsMap[ex.name];
      initial[ex.name] = Array.from({ length: ex.targetSets || 3 }, (_, idx) => ({
        setNumber: idx + 1,
        weight: prev?.weight ? String(prev.weight) : "",
        reps: prev?.reps ? String(prev.reps) : "10",
        isCompleted: false,
      }));
    });
    return initial;
  });

  const handleUpdate = (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string
  ) => {
    setSetsData((prev) => {
      const rows = [...prev[exerciseName]];
      rows[setIndex] = { ...rows[setIndex], [field]: value };
      return { ...prev, [exerciseName]: rows };
    });
  };

  const handleToggleSet = (exerciseName: string, setIndex: number) => {
    setSetsData((prev) => {
      const rows = [...prev[exerciseName]];
      rows[setIndex] = {
        ...rows[setIndex],
        isCompleted: !rows[setIndex].isCompleted,
      };
      return { ...prev, [exerciseName]: rows };
    });
  };

  const handleFinish = async () => {
    const completedSets = Object.entries(setsData).flatMap(([exerciseName, rows]) =>
      rows
        .filter((r) => r.isCompleted)
        .map((r) => ({
          exerciseName,
          setNumber: r.setNumber,
          weight: parseFloat(r.weight) || 0,
          reps: parseInt(r.reps, 10) || 0,
        }))
    );

    if (completedSets.length === 0) {
      if (!confirm("Nog geen sets afgevinkt. Toch voltooien?")) return;
    }

    setIsFinishing(true);
    await finishWorkout({ planId, startedAt, sets: completedSets });
    router.push("/");
  };

  return (
    <div className="space-y-3.5">
      {exercises.map((ex) => {
        const rows = setsData[ex.name] || [];
        const prev = previousLogsMap[ex.name];

        return (
          <section
            key={ex.id}
            className="bg-[#141416] border border-white/[0.08] rounded-[30px] p-5 space-y-3 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
          >
            {/* Header: Oefening naam & aantal sets */}
            <div className="flex items-center justify-between px-1">
              <h2 className="font-editorial text-[22px] tracking-wide text-white leading-none">
                {ex.name}
              </h2>
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
                {rows.length} {rows.length === 1 ? "SET" : "SETS"}
              </span>
            </div>

            {/* Kolomtitels */}
            <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 px-2 text-[10px] uppercase font-semibold text-[#71717a] text-center">
              <span>#</span>
              <span>KG</span>
              <span>REPS</span>
              <span></span>
            </div>

            {/* Sets lijst */}
            <div className="space-y-2">
              {rows.map((row, idx) => {
                const isDone = row.isCompleted;

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[28px_1fr_1fr_36px] gap-2.5 items-center rounded-2xl px-2 py-1.5 transition ${
                      isDone
                        ? "bg-[#1d1d22] border border-white/[0.06]"
                        : "bg-[#18181b] border border-transparent"
                    }`}
                  >
                    {/* Setnummer */}
                    <span className="text-center font-editorial text-[16px] text-[#71717a]">
                      {row.setNumber}
                    </span>

                    {/* KG Input */}
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder={prev?.weight ? String(prev.weight) : "0"}
                      value={row.weight}
                      disabled={isDone}
                      onChange={(e) =>
                        handleUpdate(ex.name, idx, "weight", e.target.value)
                      }
                      className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none focus:border-[#baa3d0] disabled:opacity-40"
                    />

                    {/* Reps Input */}
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={prev?.reps ? String(prev.reps) : "10"}
                      value={row.reps}
                      disabled={isDone}
                      onChange={(e) =>
                        handleUpdate(ex.name, idx, "reps", e.target.value)
                      }
                      className="w-full bg-[#121214] border border-white/[0.06] rounded-xl py-2 text-center font-mono text-[15px] font-medium text-white outline-none focus:border-[#baa3d0] disabled:opacity-40"
                    />

                    {/* Check Circle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSet(ex.name, idx)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition apple-press ${
                        isDone
                          ? "bg-[#baa3d0] text-[#141416]"
                          : "border border-white/20 text-transparent hover:border-[#baa3d0] hover:text-[#baa3d0]"
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Grote Monolith Afronden Knop (exact zoals home hero cards) */}
      <button
        onClick={handleFinish}
        disabled={isFinishing}
        className="w-full bg-[#141416] border border-white/[0.08] rounded-[30px] py-4 text-center transition apple-press shadow-[0_12px_28px_rgba(0,0,0,0.2)] disabled:opacity-50"
      >
        <span className="font-editorial text-[20px] tracking-wider text-[#baa3d0] uppercase leading-none block">
          {isFinishing ? "OPSLAAN..." : "SESSIE VOLTOOIEN"}
        </span>
      </button>
    </div>
  );
}