import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateStripProps {
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
  hasWorkoutMap: { [day: number]: boolean };
}

const DAYS = [
  { idx: 1, name: "Mon" },
  { idx: 2, name: "Tue" },
  { idx: 3, name: "Wed" },
  { idx: 4, name: "Thu" },
  { idx: 5, name: "Fri" },
  { idx: 6, name: "Sat" },
  { idx: 0, name: "Sun" },
];

export const DateStrip: React.FC<DateStripProps> = ({ selectedDayIdx, onSelectDay, hasWorkoutMap }) => {
  return (
    <div className="bg-[#161715] border border-[#232521] rounded-[28px] p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 px-1">
        <span className="text-sm font-bold text-white tracking-tight">Week Protocol</span>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded-full bg-[#20221e] flex items-center justify-center text-[#868685] hover:text-white transition">
            <ChevronLeft size={16} />
          </button>
          <button className="w-7 h-7 rounded-full bg-[#20221e] flex items-center justify-center text-[#868685] hover:text-white transition">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => {
          const isSelected = selectedDayIdx === d.idx;
          const hasWorkout = hasWorkoutMap[d.idx];

          return (
            <button
              key={d.idx}
              onClick={() => onSelectDay(d.idx)}
              className={"flex flex-col items-center py-3 rounded-[20px] transition-all " +
                (isSelected
                  ? "bg-[#9fe870] text-[#0e0f0c] font-black scale-105 shadow-md shadow-[#9fe870]/10"
                  : "bg-[#1c1d1a] text-[#868685] hover:bg-[#252723]")
              }
            >
              <span className="text-[11px] font-semibold tracking-tight">{d.name}</span>
              <span className={"text-sm font-extrabold mt-0.5 " + (isSelected ? "text-[#0e0f0c]" : "text-white")}>
                {d.idx === 0 ? 7 : d.idx}
              </span>
              <span className={"w-1.5 h-1.5 rounded-full mt-1.5 " + (hasWorkout ? (isSelected ? "bg-[#0e0f0c]" : "bg-[#9fe870]") : "bg-transparent")} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
