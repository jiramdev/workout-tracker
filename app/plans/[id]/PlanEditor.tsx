// app/plans/[id]/PlanEditor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Check, Edit2, GripVertical } from "lucide-react";
import {
  updatePlanName,
  addExerciseToPlan,
  updateExercise,
  reorderExercises,
  removeExerciseFromPlan,
  deletePlan,
} from "./actions";

interface ExerciseItem {
  id: string;
  name: string;
  targetSets?: number;
  restSeconds?: number;
}

interface DragState {
  id: string;
  pointerId: number;
  startIndex: number;
  overIndex: number;
  startY: number;
  deltaY: number;
  slot: number;
  tops: number[];
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

  const [items, setItems] = useState(exercises);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const listRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [targetSets, setTargetSets] = useState("3");
  const [restSeconds, setRestSeconds] = useState("90");
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSets, setEditSets] = useState("");
  const [editRest, setEditRest] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (draggingRef.current) return;
    setItems(exercises);
  }, [exercises]);

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsEditingTitle(false);
    await updatePlanName(planId, name);
  };

  function parseCount(value: string, min: number, max: number) {
    if (!value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
    return parsed;
  }

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    const sets = parseCount(targetSets, 1, 20);
    const rest = parseCount(restSeconds, 0, 600);
    if (!exerciseName.trim()) {
      setAddError("Vul een naam in.");
      return;
    }
    if (sets === null) {
      setAddError("Aantal sets moet tussen 1 en 20 liggen.");
      return;
    }
    if (rest === null) {
      setAddError("Rusttijd moet tussen 0 en 600 seconden liggen.");
      return;
    }
    setAddError(null);
    await addExerciseToPlan(planId, exerciseName, sets, rest);
    setExerciseName("");
    setTargetSets("3");
    setRestSeconds("90");
    setIsAddingExercise(false);
  };

  function startEdit(exercise: ExerciseItem) {
    setEditingId(exercise.id);
    setEditName(exercise.name);
    setEditSets(String(exercise.targetSets ?? 3));
    setEditRest(String(exercise.restSeconds ?? 90));
    setEditError(null);
  }

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const sets = parseCount(editSets, 1, 20);
    const rest = parseCount(editRest, 0, 600);
    if (!editName.trim()) {
      setEditError("Vul een naam in.");
      return;
    }
    if (sets === null) {
      setEditError("Aantal sets moet tussen 1 en 20 liggen.");
      return;
    }
    if (rest === null) {
      setEditError("Rusttijd moet tussen 0 en 600 seconden liggen.");
      return;
    }

    const result = await updateExercise(planId, editingId, editName, sets, rest);
    if (result?.error) {
      setEditError(result.error);
      return;
    }
    setItems((current) =>
      current.map((exercise) =>
        exercise.id === editingId
          ? { ...exercise, name: editName.trim(), targetSets: sets, restSeconds: rest }
          : exercise
      )
    );
    setEditingId(null);
  };

  function startDrag(event: React.PointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0 || items.length < 2) return;
    const list = listRef.current;
    if (!list) return;
    const rows = [...list.querySelectorAll<HTMLElement>("[data-exercise-id]")];
    const listTop = list.getBoundingClientRect().top;
    const tops = rows.map((row) => row.getBoundingClientRect().top - listTop);
    const slot =
      tops[index + 1] != null
        ? tops[index + 1] - tops[index]
        : tops[index] - (tops[index - 1] ?? tops[index]);

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const next: DragState = {
      id: items[index].id,
      pointerId: event.pointerId,
      startIndex: index,
      overIndex: index,
      startY: event.clientY,
      deltaY: 0,
      slot,
      tops,
    };
    draggingRef.current = true;
    dragRef.current = next;
    setDrag(next);
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId || !listRef.current) return;
    const y = event.clientY - listRef.current.getBoundingClientRect().top;
    let overIndex = current.tops.length - 1;
    for (let i = 0; i < current.tops.length; i++) {
      const mid =
        i < current.tops.length - 1
          ? (current.tops[i] + current.tops[i + 1]) / 2
          : current.tops[i] + current.slot / 2;
      if (y < mid) {
        overIndex = i;
        break;
      }
    }
    const next = { ...current, overIndex, deltaY: event.clientY - current.startY };
    dragRef.current = next;
    setDrag(next);
  }

  async function endDrag(event: React.PointerEvent<HTMLButtonElement>) {
    const current = dragRef.current;
    if (!current || event.pointerId !== current.pointerId) return;
    dragRef.current = null;
    draggingRef.current = false;
    setDrag(null);
    if (current.startIndex === current.overIndex) return;

    const reordered = [...itemsRef.current];
    const [moved] = reordered.splice(current.startIndex, 1);
    reordered.splice(current.overIndex, 0, moved);
    itemsRef.current = reordered;
    setItems(reordered);
    const result = await reorderExercises(
      planId,
      reordered.map((exercise) => exercise.id)
    );
    if (result?.error) setItems(exercises);
  }

  function dragShift(index: number) {
    if (!drag) return 0;
    if (index === drag.startIndex) return drag.deltaY;
    if (drag.overIndex > drag.startIndex && index > drag.startIndex && index <= drag.overIndex) {
      return -drag.slot;
    }
    if (drag.overIndex < drag.startIndex && index < drag.startIndex && index >= drag.overIndex) {
      return drag.slot;
    }
    return 0;
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    setItems((current) => current.filter((exercise) => exercise.id !== exerciseId));
    if (editingId === exerciseId) setEditingId(null);
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
          {items.length} {items.length === 1 ? "oefening" : "oefeningen"} ingedeeld
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
                  type="text"
                  inputMode="numeric"
                  value={targetSets}
                  onChange={(e) => setTargetSets(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#a1a1aa] uppercase font-semibold block mb-1">
                  Rusttijd (seconden)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                />
              </div>
            </div>

            {addError && <p className="text-[12px] text-red-300">{addError}</p>}

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
        <div ref={listRef} className="space-y-2 pt-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-[#71717a] text-[13px]">
              Nog geen oefeningen toegevoegd aan dit plan.
            </div>
          ) : (
            items.map((ex, idx) => (
              <div
                key={ex.id}
                data-exercise-id={ex.id}
                className={`bg-[#1b1b1e] border border-white/[0.04] rounded-2xl px-3 py-3 ${
                  drag?.id === ex.id ? "shadow-[0_16px_32px_rgba(0,0,0,0.45)]" : ""
                }`}
                style={
                  drag
                    ? {
                        position: "relative",
                        zIndex: drag.id === ex.id ? 20 : 1,
                        transform: `translateY(${dragShift(idx)}px)`,
                        transition: drag.id === ex.id ? "none" : "transform 160ms ease",
                      }
                    : undefined
                }
              >
                {editingId === ex.id ? (
                  <form onSubmit={handleSaveExercise} className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-[#baa3d0]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block space-y-1">
                        <span className="text-[10px] text-[#a1a1aa] uppercase font-semibold">
                          Sets
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editSets}
                          onChange={(e) => setEditSets(e.target.value.replace(/[^\d]/g, ""))}
                          className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[10px] text-[#a1a1aa] uppercase font-semibold">
                          Rust (sec)
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editRest}
                          onChange={(e) => setEditRest(e.target.value.replace(/[^\d]/g, ""))}
                          className="w-full bg-[#141416] border border-white/[0.1] rounded-xl px-3 py-2 text-[13px] text-white text-center outline-none focus:border-[#baa3d0]"
                        />
                      </label>
                    </div>
                    {editError && <p className="text-[12px] text-red-300">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-[#baa3d0] text-[#141416] font-semibold py-2.5 rounded-xl text-[12px] uppercase tracking-wider apple-press"
                      >
                        Opslaan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 bg-white/[0.05] text-[#a1a1aa] py-2.5 rounded-xl text-[12px]"
                      >
                        Annuleer
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Versleep om te herschikken"
                      onPointerDown={(event) => startDrag(event, idx)}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      className="w-8 h-10 flex items-center justify-center text-[#71717a] touch-none cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <span className="w-6 h-6 rounded-full bg-[#242429] text-[11px] font-bold text-[#baa3d0] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[14px] text-white tracking-tight truncate">
                        {ex.name}
                      </h4>
                      <p className="text-[11px] text-[#71717a]">
                        {ex.targetSets ?? 3} sets • {ex.restSeconds ?? 90}s rust
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Bewerk oefening"
                      onClick={() => startEdit(ex)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717a] hover:text-[#baa3d0] hover:bg-white/[0.04] transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Verwijder oefening"
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717a] hover:text-red-400 hover:bg-white/[0.04] transition"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                )}
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