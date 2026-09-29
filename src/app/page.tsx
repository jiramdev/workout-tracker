"use client";

import React, { useState, useEffect } from "react";

type WorkoutSet = {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  done: boolean;
};

type Exercise = {
  id: string;
  name: string;
  rest: string;
  sets: WorkoutSet[];
};

type DayPlan = {
  dayName: string;
  tag: string;
  exercises: Exercise[];
};

const DEFAULT_SCHEDULE: DayPlan[] = [
  {
    dayName: "Monday",
    tag: "PUSH (90° HSPU FOCUS)",
    exercises: [
      {
        id: "m1",
        name: "90° HSPU (Parallettes)",
        rest: "3m",
        sets: [
          { id: "m1-s1", setNumber: 1, weight: "BW", reps: "2", done: false },
          { id: "m1-s2", setNumber: 2, weight: "BW", reps: "2", done: false },
          { id: "m1-s3", setNumber: 3, weight: "BW", reps: "1", done: false }
        ]
      },
      {
        id: "m2",
        name: "Weighted Dips",
        rest: "2.5m",
        sets: [
          { id: "m2-s1", setNumber: 1, weight: "+4g", reps: "8", done: false },
          { id: "m2-s2", setNumber: 2, weight: "+40kg", reps: "7", done: false },
          { id: "m2-s3", setNumber: 3, weight: "+40kg", reps: "6", done: false }
        ]
      }
    ]
  },
  {
    dayName: "Tuesday",
    tag: "LEGS A (QUADS & CALVES)",
    exercises: [
      {
        id: "t1",
        name: "Hack Squat",
        rest: "2.5m",
        sets: [
          { id: "t1-s1", setNumber: 1, weight: "+20kg", reps: "8", done: false },
          { id: "t1-s2", setNumber: 2, weight: "+25kg", reps: "6", done: false }
        ]
      }
    ]
  },
  {
    dayName: "Wednesday",
    tag: "PULL (FRONT LEVER)",
    exercises: [
      {
        id: "w1",
        name: "Weighted Pull-ups",
        rest: "2.5m",
        sets: [
          { id: "w1-s1", setNumber: 1, weight: "+20kg", reps: "6", done: false },
          { id: "w1-s2", setNumber: 2, weight: "+20kg", reps: "5", done: false }
        ]
      }
    ]
  },
  {
    dayName: "Thursday",
    tag: "REST & RECOVERY",
    exercises: []
  },
  {
    dayName: "Friday",
    tag: "LEGS B & CORE",
    exercises: [
      {
        id: "f1",
        name: "Barbell RDL",
        rest: "2.5m",
        sets: [
          { id: "f1-s1", setNumber: 1, weight: "45kg", reps: "10", done: false },
          { id: "f1-s2", setNumber: 2, weight: "45kg", reps: "10", done: false }
        ]
      }
    ]
  },
  {
    dayName: "Saturday",
    tag: "UPPER & SKILLS",
    exercises: [
      {
        id: "s1",
        name: "Weighted Muscle-up",
        rest: "3m",
        sets: [
          { id: "s1-s1", setNumber: 1, weight: "+2.5kg", reps: "3", done: false }
        ]
      }
    ]
  },
  {
    dayName: "Sunday",
    tag: "CARDIO & RECOVERY",
    exercises: []
  }
];

export default function WorkoutApp() {
  const [schedule, setSchedule] = useState<DayPlan[]>(DEFAULT_SCHEDULE);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [newExName, setNewExName] = useState("");
  const [newExRest, setNewExRest] = useState("2m");
  const [showAddModal, setShowAddModal] = useState(false);
  const [cloudUserId, setCloudUserId] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<string>("Local Storage");

  // Initialiseer cloud ID en laad data
  useEffect(() => {
    let uid = localStorage.getItem("nike_workout_uid");
    if (!uid) {
      uid = "user_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("nike_workout_uid", uid);
    }
    setCloudUserId(uid);

    const localData = localStorage.getItem("nike_workout_schedule_v2");
    if (localData) {
      try {
        setSchedule(JSON.parse(localData));
      } catch (err) {
        console.error(err);
      }
    }

    const currentDay = new Date().getDay();
    const indexMap = [6, 0, 1, 2, 3, 4, 5];
    setSelectedDayIdx(indexMap[currentDay]);
  }, []);

  const persistData = (newSchedule: DayPlan[]) => {
    setSchedule(newSchedule);
    localStorage.setItem("nike_workout_schedule_v2", JSON.stringify(newSchedule));
  };

  // Oefening acties
  const addExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newExercise: Exercise = {
      id: "ex_" + Date.now(),
      name: newExName.trim(),
      rest: newExRest || "2m",
      sets: [
        { id: "s_" + Date.now() + "_1", setNumber: 1, weight: "BW", reps: "8", done: false }
      ]
    };

    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: [...day.exercises, newExercise]
      };
    });

    persistData(updated);
    setNewExName("");
    setShowAddModal(false);
  };

  const removeExercise = (exId: string) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: day.exercises.filter((ex) => ex.id !== exId)
      };
    });
    persistData(updated);
  };

  // Set acties
  const addSet = (exId: string) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const nextSetNum = ex.sets.length + 1;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = {
            id: "s_" + Date.now() + "_" + nextSetNum,
            setNumber: nextSetNum,
            weight: lastSet ? lastSet.weight : "BW",
            reps: lastSet ? lastSet.reps : "8",
            done: false
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        })
      };
    });
    persistData(updated);
  };

  const removeSet = (exId: string, setId: string) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const filtered = ex.sets.filter((s) => s.id !== setId);
          const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          return { ...ex, sets: renumbered };
        })
      };
    });
    persistData(updated);
  };

  const updateSet = (
    exId: string,
    setId: string,
    field: "weight" | "reps" | "done",
    val: string | boolean
  ) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: val } : s))
          };
        })
      };
    });
    persistData(updated);
  };

  const resetDaySets = () => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIdx) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => ({ ...s, done: false }))
        }))
      };
    });
    persistData(updated);
  };

  const currentDay = schedule[selectedDayIdx];

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased selection:bg-[#111111] selection:text-white font-sans pb-28">
      {/* Top Utility Bar (Nike Utility-Bar Spec) */}
      <div className="bg-[#f5f5f5] text-[#111111] text-[12px] font-medium px-4 py-2 flex justify-between items-center border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#007d48]" />
          <span className="tracking-tight uppercase font-semibold">Nike Training Cloud</span>
        </div>
        <div className="text-[#707072] text-[11px] font-mono">
          ID: {cloudUserId.slice(0, 10)}
        </div>
      </div>

      {/* Primary Header */}
      <header className="px-4 pt-6 pb-4 max-w-xl mx-auto flex items-end justify-between border-b border-[#e5e5e5]">
        <div>
          <span className="text-[12px] font-bold tracking-wider text-[#707072] uppercase block">
            Athlete Protocol
          </span>
          <h1 className="text-[32px] leading-tight font-black tracking-tighter text-[#111111] uppercase">
            Master Split
          </h1>
        </div>
        <button
          onClick={resetDaySets}
          className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#111111] text-[12px] font-semibold px-4 py-2 rounded-full transition active:scale-95"
        >
          Reset Sets
        </button>
      </header>

      {/* Week Day Pills Bar (Nike Filter-Chip Style) */}
      <nav className="px-4 py-3 max-w-xl mx-auto flex gap-2 overflow-x-auto no-scrollbar border-b border-[#e5e5e5]">
        {schedule.map((day, idx) => {
          const isSelected = idx === selectedDayIdx;
          const isCompleted =
            day.exercises.length > 0 &&
            day.exercises.every((ex) => ex.sets.every((s) => s.done));

          return (
            <button
              key={day.dayName}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold tracking-tight transition whitespace-nowrap ${
                isSelected
                  ? "bg-[#111111] text-white shadow-none"
                  : "bg-white text-[#111111] border border-[#cacacb] hover:border-[#111111]"
              }`}
            >
              {day.dayName.slice(0, 3)}
              {isCompleted && <span className="ml-1 text-[#007d48]">✓</span>}
            </button>
          );
        })}
      </nav>

      {/* Main Routine Container */}
      <main className="px-4 pt-6 max-w-xl mx-auto space-y-6">
        {/* Day Header Banner */}
        <div className="bg-[#f5f5f5] p-5 rounded-none border-l-4 border-[#111111]">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#707072]">
            {currentDay.dayName}
          </span>
          <h2 className="text-[22px] font-black uppercase tracking-tight text-[#111111] mt-0.5">
            {currentDay.tag}
          </h2>
        </div>

      {/* Exercises List */}
        <div className="space-y-4">
          {currentDay.exercises.length === 0 ? (
            <div className="py-12 text-center text-[#707072]">
              <p className="text-[14px] font-medium">Rustdag of geen oefeningen gepland.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-[#111111] text-white text-[13px] font-semibold px-6 py-2.5 rounded-full inline-block"
              >
                + Oefening Toevoegen
              </button>
            </div>
          ) : (
            currentDay.exercises.map((ex) => (
              <div
                key={ex.id}
                className="border border-[#e5e5e5] bg-white p-4 transition-all"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
                  <div>
                    <h3 className="text-[16px] font-bold tracking-tight text-[#111111] uppercase">
                      {ex.name}
                    </h3>
                    <span className="text-[12px] font-medium text-[#707072]">
                      Rust: {ex.rest}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addSet(ex.id)}
                      className="bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#111111] text-[11px] font-bold px-3 py-1.5 rounded-full"
                    >
                      + Set
                    </button>
                    <button
                      onClick={() => removeExercise(ex.id)}
                      className="text-[#707072] hover:text-[#d30005] text-[13px] px-2 py-1"
                      title="Verwijder oefening"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Sets Grid */}
                <div className="mt-3 space-y-2">
                {ex.sets.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between py-2 px-3 rounded-none border text-[13px] font-mono ${
                        s.done
                          ? "bg-[#f5f5f5] border-[#e5e5e5] text-[#9e9ea0]"
                          : "bg-white border-[#e5e5e5] text-[#111111]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateSet(ex.id, s.id, "done", !s.done)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold transition ${
                            s.done
                              ? "bg-[#111111] border-[#111111] text-white"
                              : "border-[#111111] bg-white text-[#111111]"
                          }`}
                        >
                          {s.done ? "✓" : s.setNumber}
                        </button>
                        <span className="font-semibold text-[12px]">SET {s.setNumber}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Weight input */}
                        <div className="flex items-center bg-[#f5f5f5] px-2 py-1 border border-[#cacacb]">
                          <input
                            type="text"
                            value={s.weight}
                            onChange={(e) => updateSet(ex.id, s.id, "weight", e.target.value)}
                            className="bg-transparent text-center font-bold w-16 text-[#111111] focus:outline-none"
                          />
                        </div>

                        <span className="text-[#707072]">×</span>

                        {/* Reps input */}
                        <div className="flex items-center bg-[#f5f5f5] px-2 py-1 border border-[#cacacb]">
                       <input
                            type="text"
                            value={s.reps}
                            onChange={(e) => updateSet(ex.id, s.id, "reps", e.target.value)}
                            className="bg-transparent text-center font-bold w-12 text-[#111111] focus:outline-none"
                          />
                          <span className="text-[10px] text-[#707072] ml-0.5">reps</span>
                        </div>

                        {/* Remove set */}
                        {ex.sets.length > 1 && (
                          <button
                            onClick={() => removeSet(ex.id, s.id)}
                            className="text-[#9e9ea0] hover:text-[#d30005] ml-1 text-xs"
                          >
                            –
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
      </div>

        {/* Primary Nike Pill Button to Add Exercise */}
        <div className="pt-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-[#111111] hover:bg-[#39393b] active:scale-95 text-white font-bold text-[14px] uppercase tracking-wider py-4 rounded-full transition shadow-sm"
          >
            + Oefening Toevoegen Aan {currentDay.dayName}
          </button>
        </div>
      </main>

      {/* Modal / Form om nieuwe oefening toe te voegen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 border border-[#111111]">
            <h3 className="text-[18px] font-black uppercase tracking-tight text-[#111111] mb-4">
              Nieuwe Oefening
            </h3>
            <form onSubmit={addExercise} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-[#707072] uppercase block mb-1">
                  Naam Oefening
                </label>
                <input
                  type="text"
                  placeholder="Bijv. Incline Dumbbell Press"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-[#f5f5f5] border border-[#cacacb] px-3 py-2 text-[14px] font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#707072] uppercase block mb-1">
                  Rusttijd
                </label>
                <input
                  type="text"
                  placeholder="Bijv. 2m of 90s"
                  value={newExRest}
                  onChange={(e) => setNewExRest(e.target.value)}
                  className="w-full bg-[#f5f5f5] border border-[#cacacb] px-3 py-2 text-[14px] font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#111111] text-white py-3 rounded-full text-[13px] font-bold uppercase tracking-wider"
                >
                  Toevoegen
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-[#f5f5f5] text-[#111111] py-3 px-5 rounded-full text-[13px] font-bold uppercase tracking-wider"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
