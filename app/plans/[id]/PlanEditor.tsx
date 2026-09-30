// app/plans/[id]/PlanEditor.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Edit2 } from "lucide-react";
import {
  updatePlanName,
  addExerciseToPlan,
  removeExerciseFromPlan,
  deletePlan,
} from "./actions";

interface ExerciseItem {
  id: string;
  name: string;
  targetSets?: number;
  restSeconds?: number;
}

interface PlanEditorProps {
  planId: string;
  initialName: string;
  exercises: ExerciseItem[];
}

export default function PlanEditor({
  planId,
  initialName,
  exercises,
}: PlanEditorProps) {
  const [name, setName] = useState(initialName);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [targetSets, setTargetSets] = useState(3);
  const [restSeconds, setRestSeconds] = useState(90);

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsEditingTitle(false);
    await updatePlanName(planId, name);
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;
    await addExerciseToPlan(planId, exerciseName, targetSets, restSeconds);
    setExerciseName("");
    setIsAddingExercise(false);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    await removeExerciseFromPlan(planId, exerciseId);
  };

  const handleDeletePlan = async () => {
    if (confirm("Weet je zeker dat je dit hele plan wilt verwijderen?")) {
      await deletePlan(planId);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Card met Plannaam & Bewerk-optie */}
      <div className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-6 space-y-3 shadow-[0_16px_36px_rgba(0,0,0,0.25)] text-center">
        <span className="text-[11px] font-semibold tracking-[0.2em] text-[#baa3d0] uppercase block">
          Trainingsplan
        </span>

        {isEditingTitle ? (
          <form onSubmit={handleSaveTitle} className="flex items-center gap-2 justify-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="bg-[#1b1b1e] border border-white/[0.15] rounded-2xl px-4 py-2 font-editorial text-[28px] text-white text-center outline-none focus:border-[#baa3d0] max-w-[260px]"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#baa3d0] text-[#141416] flex items-center justify-center transition apple-press"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 group">
            <h1 className="text-[38px] sm:text-[44px] font-editorial tracking-tight text-white leading-none">
              {name}
            </h1>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-[#71717a] hover:text-[#baa3d0] transition p-1"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-[13px] text-[#a1a1aa] font-medium">
          {exercises.length} {exercises.length === 1 ? "oefening" : "oefeningen"} ingedeeld
        </p>
      </div>

      {/* 2. Oefeningen Lijst */}
      <section className="bg-[#141416] border border-white/[0.08] rounded-[34px] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.25)] space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-[#baa3d0] uppercase">
            Oefeningen
          </span>
          <button
            onClick={() => setIsAddingExercise(!isAddingExercise)}
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#baa3d0] uppercase hover:text-white transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Oefening Toevoegen
          </button>
        </div>

        {/* Formulier om oefening toe te voegen */}
        {isAddingExercise && (
          <form
            onSubmit={handleAddExercise}
            className="bg-[#1b1b1e] border border-white/[0.08] rounded-2xl p-4 space-y-3"
          >
            <div>
              <label className="text-[11px] text-[#a1a1aa] uppercase font-semibold block mb-1">
                Naam van de oefening
              </label>
              <input
                type="text"
                placeholder="Bijv. Weighted Pull Ups, Bench Press"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                autoFocus
                className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white placeholder-[#71717a] outline-none focus:border-[#baa3d0]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#a1a1aa] uppercase font-semibold block mb-1">
                  Doel Aantal Sets
                </label>
                <input
                  type="number"
                  value={targetSets}
                  onChange={(e) => setTargetSets(Number(e.target.value))}
                  className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a1a1aa] uppercase font-semibold block mb-1">
                  Rusttijd (seconden)
                </label>
                <input
                  type="number"
                  value={restSeconds}
                  step={15}
                  onChange={(e) => setRestSeconds(Number(e.target.value))}
                  className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-[#baa3d0] text-[#141416] font-semibold py-2.5 rounded-xl text-[12px] uppercase tracking-wider hover:opacity-90 transition apple-press"
              >
                Toevoegen
              </button>
              <button
                type="button"
                onClick={() => setIsAddingExercise(false)}
                className="px-4 bg-white/[0.05] text-[#a1a1aa] py-2.5 rounded-xl text-[12px] hover:text-white transition"
              >
                Annuleer
              </button>
            </div>
          </form>
        )}

        {/* Oefeningen in dit plan */}
        <div className="space-y-2 pt-1">
          {exercises.length === 0 ? (
            <div className="py-8 text-center text-[#71717a] text-[13px]">
              Nog geen oefeningen toegevoegd aan dit plan.
            </div>
          ) : (
            exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="bg-[#1b1b1e] border border-white/[0.04] rounded-2xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#242429] text-[11px] font-bold text-[#baa3d0] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-[14px] text-white tracking-tight">
                      {ex.name}
                    </h4>
                    <p className="text-[11px] text-[#71717a]">
                      {ex.targetSets || 3} sets • {ex.restSeconds || 90}s rust
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteExercise(ex.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717a] hover:text-red-400 hover:bg-white/[0.04] transition"
                >
                  <Trash2 className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. Verwijder Plan Knop */}
      <div className="pt-2 px-1 text-center">
        <button
          onClick={handleDeletePlan}
          className="text-[12px] text-red-400/80 hover:text-red-300 font-semibold tracking-wider uppercase transition"
        >
          Plan Definitief Verwijderen
        </button>
      </div>
    </div>
  );
}