// app/plans/new/page.tsx
"use client";

import { useState } from "react";
import { createWorkoutPlan, ExerciseInput } from "@/app/actions/plans";
import Link from "next/link";

export default function NewPlanPage() {
  const [planName, setPlanName] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { name: "", targetSets: 3, restSeconds: 90 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { name: "", targetSets: 3, restSeconds: 90 },
    ]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExercise(
    index: number,
    field: keyof ExerciseInput,
    value: string | number
  ) {
    setExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validExercises = exercises.filter((ex) => ex.name.trim().length > 0);
    if (validExercises.length === 0) {
      setError("Voeg minimaal één oefening met een naam toe.");
      setLoading(false);
      return;
    }

    const res = await createWorkoutPlan({
      name: planName,
      exercises: validExercises,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-20 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/plans" className="text-sm text-zinc-400 hover:text-white">
          ← Terug naar plannen
        </Link>
        <h1 className="text-xl font-bold">Nieuw Plan Maken</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2">
            Naam van je schema
          </label>
          <input
            type="text"
            required
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="bijv. Push Day, Pull Day, Legs"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 text-base"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Oefeningen ({exercises.length})
            </h2>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs font-semibold px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 hover:bg-zinc-700"
            >
              + Oefening toevoegen
            </button>
          </div>

          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400">
                  Oefening #{index + 1}
                </span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Verwijder
                  </button>
                )}
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={exercise.name}
                  onChange={(e) =>
                    updateExercise(index, "name", e.target.value)
                  }
                  placeholder="bijv. Bench Press"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                    Aantal sets
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={exercise.targetSets}
                    onChange={(e) =>
                      updateExercise(
                        index,
                        "targetSets",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                    Rusttijd (sec)
                  </label>
                  <input
                    type="number"
                    step={15}
                    min={0}
                    max={600}
                    value={exercise.restSeconds}
                    onChange={(e) =>
                      updateExercise(
                        index,
                        "restSeconds",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-white text-zinc-950 font-bold rounded-xl text-center hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer text-base shadow-lg"
        >
          {loading ? "Plan opslaan..." : "Plan Opslaan"}
        </button>
      </form>
    </main>
  );
}