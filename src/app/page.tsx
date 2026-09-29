"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { DateStrip } from "@/components/DateStrip";
import { ExerciseCard } from "@/components/ExerciseCard";
import { TimerOverlay } from "@/components/TimerOverlay";
import { BottomNav } from "@/components/BottomNav";
import { RoutinePlan, WeekSchedule, Exercise } from "@/types/workout";
import { DEFAULT_PLANS, DEFAULT_SCHEDULE, EXERCISE_LIBRARY } from "@/data/defaultPlans";
import { Plus, RotateCcw, Dumbbell, Trash2, CheckCircle2 } from "lucide-react";

export default function WorkoutApp() {
  const [plans, setPlans] = useState<RoutinePlan[]>(DEFAULT_PLANS);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"today" | "plans" | "schedule">("today");

  // Timer State
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLeft, setTimerLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Routine Edit & Exercise Selector State
  const [editingPlan, setEditingPlan] = useState<RoutinePlan | null>(null);
  const [showAddExModal, setShowAddExModal] = useState<boolean>(false);
  const [selectedLibraryEx, setSelectedLibraryEx] = useState<string>(EXERCISE_LIBRARY[0].name);
  const [configuredSetsCount, setConfiguredSetsCount] = useState<number>(3);
  const [configuredRestSec, setConfiguredRestSec] = useState<number>(120);

  useEffect(() => {
    const savedPlans = localStorage.getItem("wise_pro_plans_v2");
    if (savedPlans) {
      try { setPlans(JSON.parse(savedPlans)); } catch (e) { console.error(e); }
    }
    const savedSched = localStorage.getItem("wise_pro_schedule_v2");
    if (savedSched) {
      try { setSchedule(JSON.parse(savedSched)); } catch (e) { console.error(e); }
    }
    setSelectedDayIdx(new Date().getDay());
  }, []);

  const persistPlans = (updated: RoutinePlan[]) => {
    setPlans(updated);
    localStorage.setItem("wise_pro_plans_v2", JSON.stringify(updated));
  };

  const persistSchedule = (updated: WeekSchedule) => {
    setSchedule(updated);
    localStorage.setItem("wise_pro_schedule_v2", JSON.stringify(updated));
  };

  // Timer countdown
  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerRef.current = setTimeout(() => setTimerLeft((prev) => prev - 1), 1000);
    } else if (timerLeft <= 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timerLeft]);

  const startTimer = (seconds: number) => {
    setTimerLeft(seconds);
    setTimerRunning(true);
  };

  const currentPlan = plans.find((p) => p.id === schedule[selectedDayIdx]);

  // Workout Action Handlers
  const handleCheckSet = (exId: string, setId: string, restSec: number) => {
    if (!currentPlan) return;
    let markCompleted = false;

    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.id !== setId) return s;
          const next = !s.done;
          if (next) markCompleted = true;
          return {
            ...s,
            done: next,
            lastWeight: next && s.weight ? s.weight : s.lastWeight,
            lastReps: next && s.reps ? s.reps : s.lastReps
          };
        })
      };
    });

    const updated = plans.map((p) => p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p);
    persistPlans(updated);

    if (markCompleted && restSec > 0) {
      startTimer(restSec);
    }
  };

  const handleUpdateSet = (exId: string, setId: string, field: "weight" | "reps", val: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: val } : s))
      };
    });
    persistPlans(plans.map((p) => p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p));
  };

  const handleAddSet = (exId: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      const nextNum = ex.sets.length + 1;
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: "s-" + Date.now() + "-" + nextNum,
            setNumber: nextNum,
            weight: last ? last.weight : "",
            reps: last ? last.reps : "",
            lastWeight: last ? last.lastWeight : "",
            lastReps: last ? last.lastReps : "",
            done: false
          }
        ]
      };
    });
    persistPlans(plans.map((p) => p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p));
  };

  const handleRemoveSet = (exId: string, setId: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.filter((s) => s.id !== setId).map((s, i) => ({ ...s, setNumber: i + 1 }))
      };
    });
    persistPlans(plans.map((p) => p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p));
  };

  const handleResetDay = () => {
    if (!currentPlan) return;
    const updated = currentPlan.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, done: false }))
    }));
    persistPlans(plans.map((p) => p.id === currentPlan.id ? { ...p, exercises: updated } : p));
    setTimerRunning(false);
  };

  // Add Exercise from Library to Plan
  const handleConfirmAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const libMatch = EXERCISE_LIBRARY.find((item) => item.name === selectedLibraryEx);
    const sets = Array.from({ length: configuredSetsCount }).map((_, i) => ({
      id: "s-" + Date.now() + "-" + (i + 1),
      setNumber: i + 1,
      weight: "",
      reps: "",
      done: false
    }));

    const newEx: Exercise = {
      id: "ex-" + Date.now(),
      name: selectedLibraryEx,
      targetMuscle: libMatch ? libMatch.target : "General",
      restSeconds: configuredRestSec,
      sets
    };

    const updated = plans.map((p) =>
      p.id === editingPlan.id ? { ...p, exercises: [...p.exercises, newEx] } : p
    );
    persistPlans(updated);
    setEditingPlan({ ...editingPlan, exercises: [...editingPlan.exercises, newEx] });
    setShowAddExModal(false);
  };

  const handleRemoveExerciseFromPlan = (planId: string, exId: string) => {
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, exercises: p.exercises.filter((ex) => ex.id !== exId) } : p
    );
    persistPlans(updated);
    if (editingPlan && editingPlan.id === planId) {
      setEditingPlan({ ...editingPlan, exercises: editingPlan.exercises.filter((ex) => ex.id !== exId) });
    }
  };

  const hasWorkoutMap = [0, 1, 2, 3, 4, 5, 6].reduce((acc, d) => {
    acc[d] = !!schedule[d];
    return acc;
  }, {} as { [d: number]: boolean });

  // Calculate volume
  const totalVolume = plans.reduce((acc, p) => {
    return acc + p.exercises.reduce((exAcc, ex) => {
      return exAcc + ex.sets.reduce((sAcc, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseFloat(s.reps) || 0;
        return s.done ? sAcc + (w * r) : sAcc;
      }, 0);
    }, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#0e0f0c] text-white font-sans pb-32">
      {timerRunning && (
        <TimerOverlay
          secondsLeft={timerLeft}
          onAddSeconds={(s) => setTimerLeft((prev) => prev + s)}
          onStop={() => { setTimerRunning(false); setTimerLeft(0); }}
        />
      )}

      <div className="max-w-lg mx-auto px-5 pt-6">
        <Header athleteName="Marijn" totalVolumeKg={Math.round(totalVolume)} />

        {activeTab === "today" && (
          <main className="space-y-6">
            <DateStrip
              selectedDayIdx={selectedDayIdx}
              onSelectDay={(idx) => setSelectedDayIdx(idx)}
              hasWorkoutMap={hasWorkoutMap}
            />

            {/* Today Activity Overview Hero */}
            <div className="bg-[#161715] border border-[#232521] rounded-[28px] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#868685] uppercase tracking-wider block">
                    Your Activity Today
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    {currentPlan ? currentPlan.title : "Rest & Regeneration"}
                  </h2>
                </div>
                {currentPlan && (
                  <button
                    onClick={handleResetDay}
                    className="w-10 h-10 rounded-full bg-[#20221e] flex items-center justify-center text-[#868685] hover:text-[#9fe870] transition"
                    title="Reset workout sets"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>

              {currentPlan && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-[#1c1d1a] border border-[#262824] rounded-[20px] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#182315] text-[#9fe870] flex items-center justify-center font-bold">
                      <Dumbbell size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#868685] block font-medium">Routine</span>
                      <span className="text-sm font-extrabold text-white">{currentPlan.category}</span>
                    </div>
                  </div>

                  <div className="bg-[#1c1d1a] border border-[#262824] rounded-[20px] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#182315] text-[#9fe870] flex items-center justify-center font-bold">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#868685] block font-medium">Exercises</span>
                      <span className="text-sm font-extrabold text-white">{currentPlan.exercises.length} Active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exercises List */}
            {currentPlan && currentPlan.exercises.length > 0 ? (
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#868685] px-1">
                  Active Exercises
                </h3>
                {currentPlan.exercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onCheckSet={(setId, rest) => handleCheckSet(ex.id, setId, rest)}
                    onUpdateSet={(setId, field, val) => handleUpdateSet(ex.id, setId, field, val)}
                    onAddSet={() => handleAddSet(ex.id)}
                    onRemoveSet={(setId) => handleRemoveSet(ex.id, setId)}
                    onStartTimer={(sec) => startTimer(sec)}
                  />
                ))}
              </section>
            ) : (
              <div className="py-12 text-center text-[#868685] bg-[#161715] border border-[#232521] rounded-[28px] p-8">
                <p className="text-sm font-medium">No routine assigned for this day.</p>
                <button
                  onClick={() => setActiveTab("schedule")}
                  className="mt-4 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] text-xs font-black px-6 py-3 rounded-full transition active:scale-95"
                >
                  Configure Weekly Split
                </button>
              </div>
            )}
          </main>
        )}

        {/* ================= TAB 2: ROUTINES / PLANS ================= */}
        {activeTab === "plans" && (
          <main className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Routines & Splits</h2>
                <p className="text-xs text-[#868685] mt-0.5">Customize workouts and configure sets</p>
              </div>
              <button
                onClick={() => {
                  const title = prompt("Routine Name (e.g. Upper Body Hypertrophy):");
                  if (!title) return;
                  const newP: RoutinePlan = { id: "plan-" + Date.now(), title, category: "Upper", exercises: [] };
                  persistPlans([...plans, newP]);
                }}
                className="bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-black text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus size={16} /> New Plan
              </button>
            </div>

            <div className="space-y-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#161715] border border-[#232521] rounded-[24px] p-5 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-[#9fe870] uppercase tracking-wider block">
                      {p.category}
                    </span>
                    <h3 className="text-base font-black text-white tracking-tight mt-0.5">{p.title}</h3>
                    <span className="text-xs text-[#868685] font-medium block mt-1">
                      {p.exercises.length} Exercises configured
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingPlan(p)}
                    className="bg-[#20221e] hover:bg-[#2c2f29] text-white text-xs font-bold px-4 py-2 rounded-full transition active:scale-95"
                  >
                    Edit Routine
                  </button>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* ================= TAB 3: SCHEDULE ================= */}
        {activeTab === "schedule" && (
          <main className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Weekly Assignment</h2>
              <p className="text-xs text-[#868685] mt-0.5">Choose which routine runs on each day</p>
            </div>

            <div className="bg-[#161715] border border-[#232521] rounded-[28px] p-4 space-y-3">
              {[
                { idx: 1, name: "Monday" },
                { idx: 2, name: "Tuesday" },
                { idx: 3, name: "Wednesday" },
                { idx: 4, name: "Thursday" },
                { idx: 5, name: "Friday" },
                { idx: 6, name: "Saturday" },
                { idx: 0, name: "Sunday" },
              ].map((d) => (
                <div
                  key={d.idx}
                  className="flex items-center justify-between p-3 rounded-[20px] bg-[#1c1d1a] border border-[#262824]"
                >
                  <span className="font-bold text-sm text-white w-28">{d.name}</span>
                  <select
                    value={schedule[d.idx] || ""}
                    onChange={(e) => persistSchedule({ ...schedule, [d.idx]: e.target.value })}
                    className="bg-[#131412] text-xs font-bold text-white border border-[#2a2c27] rounded-[16px] px-3 py-2 focus:outline-none focus:border-[#9fe870]"
                  >
                    <option value="">Rest Day</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>

      {/* Routine Editor Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161715] border border-[#2a2c28] rounded-[32px] max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#232521]">
              <div>
                <span className="text-[10px] font-bold text-[#9fe870] uppercase">Plan Configurator</span>
                <h3 className="text-xl font-black text-white">{editingPlan.title}</h3>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="w-8 h-8 rounded-full bg-[#20221e] flex items-center justify-center text-xs font-bold text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#868685]">
                Exercises in this Routine
              </h4>
              {editingPlan.exercises.length === 0 ? (
                <p className="text-xs text-[#868685] italic py-4">No exercises added yet.</p>
              ) : (
                editingPlan.exercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-3.5 rounded-[20px] bg-[#1c1d1a] border border-[#262824]"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-white block">{ex.name}</span>
                      <span className="text-[11px] text-[#868685]">
                      {ex.sets.length} sets configured · {ex.restSeconds}s rest
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveExerciseFromPlan(editingPlan.id, ex.id)}
                      className="text-[#868685] hover:text-[#d03238] p-1.5 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddExModal(true)}
                className="flex-1 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-black text-xs py-3 rounded-full flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus size={16} /> Add Exercise from Library
              </button>
              <button
                onClick={() => setEditingPlan(null)}
                className="bg-#20221e] text-white font-bold text-xs px-6 py-3 rounded-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise & Config Sets Modal */}
      {showAddExModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161715] border border-[#2a2c28] rounded-[28px] max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Add Exercise to Routine</h3>
            <form onSubmit={handleConfirmAddExercise} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#868685] uppercase block mb-1">
                  Choose Exercise
                </label>
                <select
                  value={selectedLibraryEx}
                  onChange={(e) => {
                    setSelectedLibraryEx(e.target.value);
                    const match = EXERCISE_LIBRARY.find((item) => item.name === e.target.value);
                    if (match) setConfiguredRestSec(match.defaultRest);
                  }}
                  className="w-full bg-[#1c1d1a] border border-[#2a2c28] text-xs font-bold text-white rounded-[14px] px-3 py-2.5 focus:outline-none focus:border-[#9fe870]"
                >
                  {EXERCISE_LIBRARY.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name} ({item.target})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#868685] uppercase block mb-1">
                  Number of Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={configuredSetsCount}
                  onChange={(e) => setConfiguredSetsCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#1c1d1a] border border-[#2a2c28] text-xs font-bold text-white rounded-[14px] px-3 py-2.5 focus:outline-none focus:border-[#9fe870]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#868685] uppercase block mb-1">
                  Rest Seconds
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={configuredRestSec}
                  onChange={(e) => setConfiguredRestSec(Number(e.target.value))}
                  className="w-full bg-[#1c1d1a] border border-[#2a2c28] text-xs font-bold text-white rounded-[14px] px-3 py-2.5 focus:outline-none focus:border-[#9fe870]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-black text-xs py-3 rounded-full transition"
                >
                  Add to Routine
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExModal(false)}
                  className="bg-[#20221e] text-white font-bold text-xs px-4 py-3 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav activeTab={activeTab} onChangeTab={(t) => setActiveTab(t)} />
    </div>
  );
}
