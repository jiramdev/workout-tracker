"use client";

import React, { useState, useEffect, useRef } from "react";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  lastWeight?: string;
  lastReps?: string;
  done: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  restSeconds: number;
  sets: WorkoutSet[];
};

export type RoutinePlan = {
  id: string;
  title: string;
  category: string;
  exercises: Exercise[];
};

export type WeekSchedule = {
  [dayIndex: number]: string;
};

const DEFAULT_PLANS: RoutinePlan[] = [
  {
    id: "plan-push",
    title: "Push Heavy",
    category: "Push",
    exercises: [
      {
        id: "ex-1",
        name: "90° HSPU (Parallettes)",
        restSeconds: 150,
        sets: [
          { id: "s-1-1", setNumber: 1, weight: "BW", reps: "2", lastWeight: "BW", lastReps: "2", done: false },
          { id: "s-1-2", setNumber: 2, weight: "BW", reps: "2", lastWeight: "BW", lastReps: "1", done: false }
        ]
      },
      {
        id: "ex-2",
        name: "Weighted Dips",
        restSeconds: 120,
        sets: [
          { id: "s-2-1", setNumber: 1, weight: "40", reps: "8", lastWeight: "37.5", lastReps: "8", done: false },
          { id: "s-2-2", setNumber: 2, weight: "40", reps: "7", lastWeight: "37.5", lastReps: "7", done: false }
        ]
      }
    ]
  },
  {
    id: "plan-pull",
    title: "Pull & Front Lever",
    category: "Pull",
    exercises: [
      {
        id: "ex-3",
        name: "Front Lever Holds",
        restSeconds: 180,
        sets: [
          { id: "s-3-1", setNumber: 1, weight: "BW", reps: "5s", lastWeight: "BW", lastReps: "5s", done: false }
        ]
      }
    ]
  },
  {
    id: "plan-legs",
    title: "Legs & Core",
    category: "Legs",
    exercises: [
      {
        id: "ex-4",
        name: "Hack Squat",
        restSeconds: 150,
        sets: [
          { id: "s-4-1", setNumber: 1, weight: "30", reps: "8", lastWeight: "25", lastReps: "8", done: false }
        ]
      }
    ]
  }
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  1: "plan-push",
  2: "plan-legs",
  3: "plan-pull",
  4: "",
  5: "plan-legs",
  6: "plan-push",
  0: ""
};

const DAYS_OF_WEEK = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export default function WiseWorkoutApp() {
  const [plans, setPlans] = useState<RoutinePlan[]>(DEFAULT_PLANS);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [activeTab, setActiveTab] = useState<"today" | "plans" | "schedule">("today");
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [editingPlan, setEditingPlan] = useState<RoutinePlan | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExRest, setNewExRest] = useState(90);

  useEffect(() => {
    const p = localStorage.getItem("wise_plans_v1");
    if (p) { try { setPlans(JSON.parse(p)); } catch (e) {} }
    const s = localStorage.getItem("wise_schedule_v1");
    if (s) { try { setWeekSchedule(JSON.parse(s)); } catch (e) {} }
    setSelectedDayIndex(new Date().getDay());
  }, []);

  const savePlans = (updated: RoutinePlan[]) => {
    setPlans(updated);
    localStorage.setItem("wise_plans_v1", JSON.stringify(updated));
  };

  const saveSchedule = (updated: WeekSchedule) => {
    setWeekSchedule(updated);
    localStorage.setItem("wise_schedule_v1", JSON.stringify(updated));
  };

  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      timerIntervalRef.current = setTimeout(() => setTimerLeft((t) => t - 1), 1000);
    } else if (timerLeft <= 0 && timerRunning) {
      setTimerRunning(false);
    }
    return () => { if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current); };
  }, [timerRunning, timerLeft]);

  const startTimer = (seconds: number) => {
    setTimerLeft(seconds);
    setTimerRunning(true);
  };

  const currentPlanId = weekSchedule[selectedDayIndex];
  const currentPlan = plans.find((p) => p.id === currentPlanId);

  const handleCheckSet = (exerciseId: string, setId: string, restSec: number) => {
    if (!currentPlan) return;
    let justCompleted = false;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.id !== setId) return s;
          const next = !s.done;
          if (next) justCompleted = true;
          return {
            ...s,
            done: next,
            lastWeight: next && s.weight ? s.weight : s.lastWeight,
            lastReps: next && s.reps ? s.reps : s.lastReps
          };
        })
      };
    });
    const updated = plans.map((p) => (p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p));
    savePlans(updated);
    if (justCompleted && restSec > 0) startTimer(restSec);
  };

  const updateSetValues = (exerciseId: string, setId: string, field: "weight" | "reps", val: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: val } : s))
      };
    });
    savePlans(plans.map((p) => (p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p)));
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
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
    savePlans(plans.map((p) => (p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p)));
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.filter((s) => s.id !== setId).map((s, idx) => ({ ...s, setNumber: idx + 1 }))
      };
    });
    savePlans(plans.map((p) => (p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p)));
  };

  const handleAddNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !editingPlan) return;
    const newEx: Exercise = {
      id: "ex-" + Date.now(),
      name: newExName.trim(),
      restSeconds: Number(newExRest) || 90,
      sets: [
        { id: "s-" + Date.now() + "-1", setNumber: 1, weight: "", reps: "", done: false },
        { id: "s-" + Date.now() + "-2", setNumber: 2, weight: "", reps: "", done: false }
      ]
    };
    const updated = plans.map((p) => (p.id === editingPlan.id ? { ...p, exercises: [...p.exercises, newEx] } : p));
    savePlans(updated);
    setEditingPlan({ ...editingPlan, exercises: [...editingPlan.exercises, newEx] });
    setNewExName("");
    setShowAddExerciseModal(false);
  };

  const removeExerciseFromPlan = (planId: string, exerciseId: string) => {
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, exercises: p.exercises.filter((ex) => ex.id !== exerciseId) } : p
    );
    savePlans(updated);
    if (editingPlan && editingPlan.id === planId) {
      setEditingPlan({ ...editingPlan, exercises: editingPlan.exercises.filter((ex) => ex.id !== exerciseId) });
    }
  };

  const handleCreateNewPlan = () => {
    const title = prompt("Naam van plan (bijv. Upper B):");
    if (!title) return;
    savePlans([...plans, { id: "plan-" + Date.now(), title, category: "Custom", exercises: [] }]);
  };

  const resetAllSetsForToday = () => {
    if (!currentPlan) return;
    const updatedExercises = currentPlan.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({ ...s, done: false }))
    }));
    savePlans(plans.map((p) => (p.id === currentPlan.id ? { ...p, exercises: updatedExercises } : p)));
    setTimerRunning(false);
    setTimerLeft(0);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  };

  return (
    <div className="min-h-screen bg-[#e8ebe6] text-[#0e0f0c] font-sans pb-28">
      <header className="bg-white border-b border-[#cacacb] sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#9fe870] flex items-center justify-center font-black text-lg text-[#0e0f0c]">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#0e0f0c]">WISE WORKOUT</h1>
            <p className="text-xs text-[#868685] font-semibold">Pro Tracking Protocol</p>
          </div>
        </div>
        {activeTab === "today" && currentPlan && (
          <button onClick={resetAllSetsForToday} className="text-xs font-semibold px-4 py-2 rounded-[24px] bg-[#e8ebe6] hover:bg-[#cacacb] text-[#0e0f0c] transition active:scale-95">
            Reset Dag
          </button>
        )}
      </header>

      {timerRunning && (
        <aside className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-[#0e0f0c] text-[#9fe870] px-6 py-3 rounded-[24px] shadow-2xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#868685] font-bold uppercase tracking-wider">Rusttimer</span>
            <span className="text-2xl font-blackont-mono tracking-tight text-white">{formatTime(timerLeft)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTimerLeft((prev) => prev + 30)} className="bg-[#163300] text-[#9fe870] px-3 py-1.5 rounded-[12px] text-xs font-bold hover:bg-[#9fe870] hover:text-[#0e0f0c] transition">
              +30s
            </button>
            <button onClick={() => { setTimerRunning(false); setTimerLeft(0); }} className="w-8 h-8 rounded-full bg-[#320707] text-[#d03238] flex items-center justify-center font-bold text-xs hover:bg-[#d03238] hover:text-white transition">
              ✕
            </button>
          </div>
        </aside>
      )}

      <main className="max-w-xl mx-auto px-4 pt-6">
        {activeTab === "today" && (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {DAYS_OF_WEEK.map((dName, idx) => {
                const isSelected = idx === selectedDayIndex;
              const hasAssigned = !!weekSchedule[idx];
                return (
                  <button key={dName} onClick={() => setSelectedDayIndex(idx)} className={"px-4 py-2.5 rounded-[24px] text-xs font-bold transition flex flex-col items-center min-w-[54px] " + (isSelected ? "bg-[#0e0f0c] text-white" : "bg-white text-[#454745] hover:bg-[#f5f5f5]")}>
                    <span>{dName.slice(0, 2)}</span>
                    <span className={"w-1.5 h-1.5 rounded-full mt-1 " + (hasAssigned ? "bg-[#9fe870]" : "bg-transparent")} />
                  </button>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#e8ebe6]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#868685]">{DAYS_OF_WEEK[selectedDayIndex]}</span>
                {currentPlan && (
                  <span className="bg-[#e2f6d5] text-[#054d28] text-xs font-bold px-3 py-1 rounded-full">{currentPlan.category}</span>
                )}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-[#0e0f0c]">{currentPlan ? currentPlan.title : "Geen Workout Gepland"}</h2>
              <p className="text-sm text-[#454745] mt-1">
                {currentPlan ? currentPlan.exercises.length + " oefeningen gereed. Vorige prestaties automatisch ingeladen." : "Koppel een plan via Weekplanning of neem rust."}
              </p>
            </div>

            {currentPlan && currentPlan.exercises.length > 0 && (
              <div className="space-y-4">
                {currentPlan.exercises.map((ex) => (
                  <div key={ex.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-[#e8ebe6]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e8ebe6]">
                      <div>
                        <h3 className="text-base font-black tracking-tight text-[#0e0f0c]">{ex.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-[#868685]">⏱ Rust: {ex.restSeconds}s</span>
                          <button onClick={() => startTimer(ex.restSeconds)} className="text-[11px] font-bold text-[#054d28] hover:underline">
                            Start timer
                          </button>
                        </div>
                      </div>
                      <button onClick={() => addSetToExercise(ex.id)} className="bg-[#e8ebe6] hover:bg-[#cacacb] text-[#0e0f0c] text-xs font-bold px-3.5 py-1.5 rounded-[24px] transition active:scale-95">
                        + Set
                      </button>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {ex.sets.map((s) => (
                        <div key={s.id} className={"flex items-center justify-between p-3 rounded-[16px] transition " + (s.done ? "bg-[#e2f6d5] border rder-[#c5edab]" : "bg-[#e8ebe6]/50 border border-transparent")}>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleCheckSet(ex.id, s.id, ex.restSeconds)} className={"w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition active:scale-90 " + (s.done ? "bg-[#0e0f0c] text-[#9fe870]" : "bg-white border-2 border-[#0e0f0c] text-transparent hover:bg-[#9fe870]")}>
                              ✓
                            </button>
                            <span className="font-bold text-xs text-[#0e0f0c]">SET {s.setNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center bg-white rounded-[12px] px-2.5 py-1 border border-[#cacacb] focus-within:border-[#0e0f0c]">
                                <input type="text" value={s.weight} placeholder={s.lastWeight || "kg"} onChange={(e) => updateSetValues(ex.id, s.id, "weight", e.target.value)} className="w-14 text-center font-bold text-xs text-[#0e0f0c] focus:outline-none" />
                                <span className="text-[10px] text-[#868685] font-semibold">kg</span>
                              </div>
                              {s.lastWeight && <span className="text-[9px] text-[#868685] font-medium mt-0.5">Vorige: {s.lastWeight}kg</span>}
                            </div>
                            <span className="text-[#868685] font-bold text-xs">×</span>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center bg-white rounded-[12px] px-2.5 py-1 border border-[#cacacb] focus-within:border-[#0e0f0c]">
                                <input type="text" value={s.reps} placeholder={s.lastReps || "reps"} onChange={(e) => updateSetValues(ex.id, s.id, "reps", e.target.value)} className="-12 text-center font-bold text-xs text-[#0e0f0c] focus:outline-none" />
                              </div>
                              {s.lastReps && <span className="text-[9px] text-[#868685] font-medium mt-0.5">Vorige: {s.lastReps}r</span>}
                            </div>
                            {ex.sets.length > 1 && (
                              <button onClick={() => removeSetFromExercise(ex.id, s.id)} className="text-[#868685] hover:text-[#d03238] px-1 text-sm font-bold">–</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0e0f0c]">Mijn Plannen</h2>
              <p className="text-xs text-[#868685] font-medium">Beheer routines en oefeningen</p>
              </div>
              <button onClick={handleCreateNewPlan} className="bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-black text-xs px-5 py-2.5 rounded-[24px] transition active:scale-95 shadow-sm">
                + Nieuw Plan
              </button>
            </div>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white p-5 rounded-[24px] border border-[#e8ebe6] shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#868685] uppercase tracking-wider block">{plan.category}</span>
                    <h3 className="text-lg font-black text-[#0e0f0c] mt-0.5">{plan.title}</h3>
                    <p className="text-xs text-[#454745] font-medium mt-1">{plan.exercises.length} oefeningen</p>
                  </div>
                  <button onClick={() => setEditingPlan(plan)} className="bg-[#0e0f0c] text-white hover:bg-[#454745] text-xs font-bold px-4 py-2 rounded-[24px] transition active:scale-95">
                    Bewerken
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-[#0e0f0c]">Weekplanning</h2>
              <p className="text-xs text-[#868685] font-medium">Koppel per dag welk trainingsplan actief is</p>
            </div>
            <div className="bg-white rounded-[24px] border border-[#e8ebe6] p-4 shadow-sm space-y-3">
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <div key={dayName} className="flex items-center justify-between py-2.5 px-3 rounded-[16px] bg-[#e8ebe6]/40">
                  <span className="font-bold text-sm text-[#0e0f0c] w-28">{dayName}</span>
                  <select value={weekSchedule[idx] || ""} onChange={(e) => saveSchedule({ ...weekSchedule, [idx]: e.target.value })} className="bg-white border border-[#cacacb] rounded-[16px] px-3 py-1.5 text-xs font-bold text-[#0e0f0c] focus:outline-none">
                    <option value="">Rustdag (Geen workout)</option>
                    {plans.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8ebe6]">
              <div>
                <span className="text-[11px] font-bold text-[#868685] uppercase">Plan Aanpassen</span>
                <h3 className="text-xl font-black text-[#0e0f0c]">{editingPlan.title}</h3>
              </div>
              <button onClick={() => setEditingPlan(null)} className="w-8 h-8 rounded-full bg-[#e8ebe6] flex items-center justify-center text-xs font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#868685]">Oefeningen</h4>
              {editingPlan.exercises.length === 0 ? (
                <p className="text-xs text-[#868685] italic">Nog geen oefeningen toegevoegd.</p>
              ) : (
                editingPlan.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between bg-[#e8ebe6]/50 p-3 rounded-[16px]">
                    <div>
                      <p className="font-bold text-sm text-[#0e0f0c]">{ex.name}</p>
                      <p className="text-[11px] text-[#868685]">{ex.sets.length} sets · Rust: {ex.restSeconds}s</p>
                    </div>
                    <button onClick={() => removeExerciseFromPlan(editingPlan.id, ex.id)} className="text-xs text-[#d03238] font-bold px-2 py-1">Verwijder</button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddExerciseModal(true)} className="flex-1 bg-[#9fe870] hover:bg-[#cdffad] text-[#0e0f0c] font-black text-xs py-3 rounded-[24px] transition">+ Oefening Toevoegen</button>
              <button onClick={() => setEditingPlan(null)} className="bg-[#0e0f0c] text-white font-bold text-xs px-5 py-3 rounded-[24px]">Klaar</button>
            </div>
          </div>
        </div>
      )}

      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-[#0e0f0c]">Nieuwe Oefening</h3>
            <form onSubmit={handleAddNewExercise} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#868685] uppercase block mb-1">Naam Oefening</label>
                <input type="text" placeholder="Bijv. Overhead Press" value={newExName} onChange={(e) => setNewExName(e.target.value)} className="w-full bg-[#e8ebe6] rounded-[12px] px-3 py-2 text-xs font-bold text-[#0e0f0c] focus:outline-none" autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#868685] uppercase block mb-1">Rusttijd (Seconden)</label>
                <input type="number" placeholder="90" value={newExRest} onChange={(e) => setNewExRest(Number(e.target.value))} className="w-full bg-[#e8ebe6] rounded-[12px] px-3 py-2 text-xs font-bold text-[#0e0f0c] focus:outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-[#9fe870] text-[#0e0f0c] font-black text-xs py-3 rounded-[24px]">Opslaan</button>
                <button type="button" onClick={() => setShowAddExerciseModal(false)} className="bg-[#e8ebe6] text-[#0e0f0c] font-bold text-xs px-4 py-3 rounded-[24px]">Annuleren</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#cacacb] px-6 py-3 flex justify-around max-w-xl mx-auto z-30">
        <button onClick={() => setActiveTab("today")} className={"flex flex-col items-center gap-1 transition " + (activeTab === "today" ? "text-[#0e0f0c] font-black" : "text-[#868685] font-semibold")}>
          <span className="text-lg">⚡</span><span className="text-[11px]">Vandaag</span>
        </button>
        <button onClick={() => setActiveTab("plans")} className={"flex flex-col items-center gap-1 transition " + (activeTab === "plans" ? "text-[#0e0f0c] font-black" : "text-[#868685] font-semibold")}>
          <span className="text-lg">📋</span><span className="text-[11px]">Plannen</span>
        </button>
        <button onClick={() => setActiveTab("schedule")} className={"flex flex-col items-center gap-1 transition " + (activeTab === "schedule" ? "text-[#0e0f0c] font-black" : "text-[#868685] font-semibold")}>
          <span className="text-lg">🗓️</span><span className="text-[11px]">Weekplanning</span>
        </button>
      </nav>
    </div>
  );
}
