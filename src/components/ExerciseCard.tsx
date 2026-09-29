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
    <div className="bg-[#161715] border border-[#232521] rounded-[24px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#232521]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#9fe870] block">
            {exercise.targetMuscle}
          </span>
          <h3 className="text-base font-black text-white tracking-tight mt-0.5">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#868685] flex items-center gap-1">
              <Timer size={13} className="text-[#868685]" /> {exercise.restSeconds}s rest
            </span>
            <button
              onClick={() => onStartTimer(exercise.restSeconds)}
              className="text-[11px] font-bold text-[#9fe870] hover:underline"
            >
              Start timer
            </button>
          </div>
        </div>

        <button
          onClick={onAddSet}
          className="bg-[#20221e] hover:bg-[#2c2f29] text-[#9fe870] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition active:scale-95"
        >
          <Plus size={14} /> Set
        </button>
      </div>

      <div className="space-y-2">
        {exercise.sets.map((s) => (
          <div
            key={s.id}
            className={
              "flex items-center justify-between p-3 rounded-[18px] transition-all " +
              (s.done
                ? "bg-[#182315] border border-[#2d4722]"
                : "bg-[#1c1d1a] border border-[#262824]")
            }
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onCheckSet(s.id, exercise.restSeconds)}
                className={
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition active:scale-90 " +
                  (s.done
                    ? "bg-[#9fe870] text-[#0e0f0c]"
                    : "border-2 border-[#393c35] text-transparent hover:border-[#9fe870]")
                }
              >
                <Check size={16} strokeWidth={3} className={s.done ? "text-[#0e0f0c]" : "hidden"} />
              </button>
              <span className="font-extrabold text-xs text-white">SET {s.setNumber}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center bg-[#131412] rounded-[12px] px-2.5 py-1 border border-[#2a2c27] focus-within:border-[#9fe870]">
                  <input
                    type="text"
                    value={s.weight}
                    placeholder={s.lastWeight || "kg"}
                    onChange={(e) => onUpdateSet(s.id, "weight", e.target.value)}
                    className="w-14 text-center font-bold text-xs text-white bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-[#868685] font-semibold">kg</span>
                </div>
                {s.lastWeight && (
                  <span className="text-[9px] text-[#868685] font-medium mt-0.5">
                    Prev: {s.lastWeight}kg
                  </span>
                )}
              </div>

              <span className="text-[#868685] font-bold text-xs">×</span>

              <div className="fex flex-col items-center">
                <div className="flex items-center bg-[#131412] rounded-[12px] px-2.5 py-1 border border-[#2a2c27] focus-within:border-[#9fe870]">
                  <input
                    type="text"
                    value={s.reps}
                    placeholder={s.lastReps || "reps"}
                    onChange={(e) => onUpdateSet(s.id, "reps", e.target.value)}
                    className="w-12 text-center font-bold text-xs text-white bg-transparent focus:outline-none"
                  />
                </div>
                {s.lastReps && (
                  <span className="text-[9px] text-[#868685] font-medium mt-0.5">
                    Prev: {s.lastReps}r
                  </span>
                )}
              </div>

              {exercise.sets.length > 1 && (
                <button
                  onClick={() => onRemoveSet(s.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#868685] hover:text-[#d03238] transition"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
