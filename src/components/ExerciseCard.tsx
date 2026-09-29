import React from "react";
import { Check, Plus, Minus, Timer } from "lucide-react";
import { Exercise } from "@/types/workout";

interface ExerciseCardProps {
  exercise: Exercise;
  onCheckSet: (setId: string, restSec: number) => void;
  onUpdateSet: (setId: string, field: "weight" | "reps", val: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onStartTimer: (sec: number) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onCheckSet,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onStartTimer,
}) => {
  return (
    <div className="bg-[#161715] border border-[#232521] rounded-[24px] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Exercise Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#232521]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#9fe870] block">
            {exercise.targetMuscle}
          </span>
          <h3 className="text-base font-black text-white tracking-tight mt-0.5">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#868685] flex items-center gap-1 font-mono">
              <Timer size={13} className="text-[#868685]" /> {exercise.restSeconds}s rest
            </span>
            <button
              type="button"
              onClick={() => onStartTimer(exercise.restSeconds)}
              className="text-[11px] font-bold text-[#9fe870] hover:underline"
            >
              Start timer
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddSet}
          className="bg-[#20221e] hover:bg-[#2c2f29] text-[#9fe870] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition active:scale-95 shrink-0"
        >
          <Plus size={14} /> Set
        </button>
      </div>

      {/* Sets List */}
      <div className="space-y-2">
        {exercise.sets.map((s) => (
          <div
            key={s.id}
            className={
              "flex items-center justify-between px-3 py-2.5 rounded-[18px] transition-all " +
              (s.done
                ? "bg-[#182315] border border-[#2d4722]"
                : "bg-[#1c1d1a] border border-[#262824]")
            }
          >
            {/* Ronde Check Knop + Set Nummer */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onCheckSet(s.id, exercise.restSeconds)}
                className={
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 " +
                  (s.done
                    ? "bg-[#9fe870] text-[#0e0f0c]"
                    : "border-2 border-[#393c35] text-transparent hover:border-[#9fe870] bg-[#121310]")
                }
              >
                <Check size={14} strokeWidth={3} className={s.done ? "text-[#0e0f0c]" : "hidden"} />
              </button>
              <span className="font-extrabold text-xs text-white tracking-wide">
                SET {s.setNumber}
              </span>
            </div>

            {/* Invoervelden Gewicht & Reps */}
            <div className="flex items-center gap-2">
              {/* Gewicht Capsule */}
              <div className="flex flex-col items-end">
                <div className="flex items-center h-8 bg-[#121310] rounded-[10px] px-2 border border-[#2b2d28] focus-within:border-[#9fe870] transition-colors">
                  <input
                    type="text"
                    value={s.weight}
                    placeholder={s.lastWeight || "0"}
                    onChange={(e) => onUpdateSet(s.id, "weight", e.target.value)}
                    className="w-12 text-center font-bold text-xs text-white bg-transparent focus:outline-none placeholder:text-[#52544e]"
                  />
                  <span className="text-[10px] text-[#707072] font-semibold select-none">kg</span>
                </div>
                {s.lastWeight ? (
                  <span className="text-[9px] text-[#707072] font-mono mt-0.5 pr-1">
                    {s.lastWeight}kg
                  </span>
                ) : null}
              </div>

              <span className="text-[#52544e] font-bold text-xs select-none">×</span>

              {/* Reps Capsule */}
              <div className="flex flex-col items-end">
                <div className="flex items-center h-8 bg-[#121310] rounded-[10px] px-2 border border-[#2b2d28] focus-within:border-[#9fe870] transition-colors">
                  <input
                    type="text"
                    value={s.reps}
                    placeholder={s.lastReps || "0"}
                    onChange={(e) => onUpdateSet(s.id, "reps", e.target.value)}
                    className="w-9 text-center font-bold text-xs text-white bg-transparent focus:outline-none placeholder:text-[#52544e]"
                  />
                  <span className="text-[10px] text-[#707072] font-semibold select-none">r</span>
                </div>
                {s.lastReps ? (
                  <span className="text-[9px] text-[#707072] font-mono mt-0.5 pr-1">
                    {s.lastReps}r
                  </span>
                ) : null}
              </div>

              {/* Verwijder knop voor set */}
              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(s.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#707072] hover:text-[#d03238] transition shrink-0 ml-0.5"
                  title="Remove set"
                >
                  <Minus size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};