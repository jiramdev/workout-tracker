"use client";

import React, { useState, useEffect } from "react";

type Exercise = {
  id: string;
  name: string;
  setsReps: string;
  weight: string;
  rest: string;
  done: boolean;
};

type DayPlan = {
  dayName: string;
  tag: string;
  exercises: Exercise[];
};

const INITIAL_SCHEDULE: DayPlan[] = [
  {
    dayName: "Monday",
    tag: "Push (90° HSPU Focus)",
    exercises: [
      { id: "m1", name: "90° HSPU (parallettes)", setsReps: "3-4x 1-2", weight: "BW", rest: "3m", done: false },
      { id: "m2", name: "Freestanding HSPU", setsReps: "3x 5-8", weight: "BW", rest: "2m", done: false },
      { id: "m3", name: "Weighted Dips", setsReps: "3-4x 6-8", weight: "+40 kg", rest: "2.5m", done: false },
      { id: "m4", name: "Incline Press (Barbell/DB)", setsReps: "3x 8-10", weight: "50 kg", rest: "2m", done: false },
      { id: "m5", name: "Lateral Raises", setsReps: "3x 12-15", weight: "7 kg", rest: "1m", done: false }
    ]
  },
  {
    dayName: "Tuesday",
    tag: "Legs A (Quads & Calves)",
    exercises: [
      { id: "t1", name: "Hack Squat", setsReps: "3-4x 6-8", weight: "+20 kg", rest: "2.5m", done: false },
      { id: "t2", name: "Leg Press", setsReps: "3x 10-12", weight: "120 kg", rest: "2m", done: false },
      { id: "t3", name: "Leg Extension", setsReps: "3x 10-12", weight: "50 kg", rest: "90s", done: false },
      { id: "t4", name: "Standing Calf Raises", setsReps: "4x 10-15", weight: "40 kg", rest: "1m", done: false }
    ]
  },
  {
    dayName: "Wednesday",
    tag: "Pull (Front Lever Focus)",
    exercises: [
      { id: "w1", name: "Front Lever Holds/Raises", setsReps: "4x 4-6s", weight: "BW", rest: "3m", done: false },
      { id: "w2", name: "Weighted Pull-ups", setsReps: "3-4x 5-6", weight: "+20 kg", rest: "2.5m", done: false },
      { id: "w3", name: "Chest-Supported Row", setsReps: "3x 8-10", weight: "18 kg", rest: "90s", done: false },
      { id: "w4", name: "D-Handle Lat Pulldown", setsReps: "3x 10-12", weight: "55 kg", rest: "90s", done: false },
      { id: "w5", name: "DB Hammer Curls", setsReps: "3x 10-12", weight: "14 kg", rest: "1m", done: false },
      { id: "w6", name: "Reverse EZ Curl (3s ecc)", setsReps: "3x 12-15", weight: "15 kg", rest: "1m", done: false }
    ]
  },
  {
    dayName: "Thursday",
    tag: "Rest & Recovery",
    exercises: [
      { id: "th1", name: "Focus on sleep, food & protein", setsReps: "8+ hrs", weight: "Surplus", rest: "—", done: false }
    ]
  },
  {
    dayName: "Friday",
    tag: "Legs B & Core",
    exercises: [
      { id: "f1", name: "Barbell RDL", setsReps: "3-4x 8-10", weight: "45 kg", rest: "2.5m", done: false },
      { id: "f2", name: "Leg Curl", setsReps: "3x 10-12", weight: "50 kg", rest: "90s", done: false },
      { id: "f3", name: "Bulgarian Split Squat", setsReps: "3x 8-10", weight: "BW", rest: "90s", done: false },
      { id: "f4", name: "Seated Calf Raises", setsReps: "3-4x 12-15", weight: "40 kg", rest: "1m", done: false },
      { id: "f5", name: "Hanging Legaises", setsReps: "3x 10-12", weight: "BW", rest: "1m", done: false },
      { id: "f6", name: "Dragon Flags", setsReps: "3x 5-8", weight: "BW", rest: "90s", done: false }
    ]
  },
  {
    dayName: "Saturday",
    tag: "Upper & Skills",
    exercises: [
      { id: "s1", name: "Weighted Muscle-up", setsReps: "4x 2-3", weight: "+2.5 kg", rest: "3m", done: false },
      { id: "s2", name: "OAP Progression", setsReps: "3-4x 1-2/arm", weight: "BW", rest: "3m", done: false },
      { id: "s3", name: "OAHS Drills", setsReps: "10-12 min", weight: "BW", rest: "—", done: false },
      { id: "s4", name: "Ring Dips", setsReps: "3x 10-12", weight: "BW", rest: "90s", done: false },
      { id: "s5", name: "Face Pulls", setsReps: "3-4x 12-15", weight: "25 kg", rest: "1m", done: false },
      { id: "s6", name: "Bicep / Tricep Superset", setsReps: "3x 10-12", weight: "Pump", rest: "1m", done: false }
    ]
  },
  {
    dayName: "Sunday",
    tag: "Cardio & Herstel",
    exercises: [
      { id: "su1", name: "Zone 2 R (Easy conversational)", setsReps: "25-30 min", weight: "5 km", rest: "—", done: false }
    ]
  }
];

export default function Tracker() {
  const [schedule, setSchedule] = useState<DayPlan[]>(INITIAL_SCHEDULE);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("workout_split_v1");
    if (saved) {
      try {
        setSchedule(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    const currentDay = new Date().getDay();
    const indexMap = [6, 0, 1, 2, 3, 4, 5];
    setSelectedDayIndex(indexMap[currentDay]);
  }, []);

  const saveState = (updated: DayPlan[]) => {
    setSchedule(updated);
    localStorage.setItem("workout_split_v1", JSON.stringify(updated));
  };

  const toggleExercise = (exId: string) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exId ? { ...ex, done: !ex.done } : ex
        )
      };
    });
    saveState(updated);
  };

  const updateField = (exId: string, field: "weight" | "setsReps", val: string) => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exId ? { ...ex, [field]: val } : ex
        )
      };
    });
    saveState(updated);
  };

  const resetToday = () => {
    const updated = schedule.map((day, dIdx) => {
      if (dIdx !== selectedDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => ({ ...ex, done: false }))
      };
    });
    saveState(updated);
  };

  const currentDay = schedule[selectedDayIndex];

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-8 pb-20 select-none">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">MASTER SPLIT</h1>
          <p className="text-xs text-zinc-400 font-mono">Tap values to update weight/reps</p>
        </div>
        <button
          onClick={resetToday}
          className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg active:scale-95 transition"
        >
          Reset
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {schedule.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const isDone = day.exercises.every((e) => e.done);
          return (
            <button
              key={day.dayName}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex-1 min-w-[48px] py-2 rounded-xl text-center font-mono text-xs transition ${
                isSelected
                  ? "bg-zinc-100 text-zinc-950 font-bold"
                  : "bg-zinc-900/60 text-zinc-400 border border-zinc-900"
              }`}
            >
              <div>{day.dayName.slice(0, 3)}</div>
              {isDone && <span className="text-[10px] text-emerald-500">●</span>}
            </button>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="mb-4">
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
            {currentDay.dayName}
          </span>
          <h2 className="text-lg font-bold text-zinc-100">{currentDay.tag}</h2>
        </div>

        {currentDay.exercises.map((ex) => (
          <div
            key={ex.id}
            className={`p-3.5 rounded-2xl border transition ${
              ex.done
                ? "bg-zinc-950 border-zinc-900/80 opacity-40"
                : "bg-zinc-900/40 border-zinc-800/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                onClick={() => toggleExercise(ex.id)}
                className="flex items-center gap-3 text-left flex-1"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                    ex.done
                      ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                      : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  {ex.done && <span className="text-xs font-bold leading-none">✓</span>}
                </div>
                <span
                  className={`text-sm font-medium ${
                    ex.done ? "line-through text-zinc-500" : "text-zinc-200"
                  }`}
                >
                  {ex.name}
                </span>
              </button>

              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                ⏳ {ex.rest}
              </span>
            </div>

            <div className="mt-3 pl-8 flex items-center gap-2 text-xs font-mono">
              <input
            type="text"
                value={ex.setsReps}
                onChange={(e) => updateField(ex.id, "setsReps", e.target.value)}
                className="bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2 py-1 text-zinc-300 w-24 text-center focus:outline-none focus:border-zinc-500"
              />
              <span className="text-zinc-600">@</span>
              <input
                type="text"
                value={ex.weight}
                onChange={(e) => updateField(ex.id, "weight", e.target.value)}
                className="bg-zinc-800/60 border border-zinc-700/50 rounded-md px-2 py-1 text-emerald-400 font-semibold w-24 text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
