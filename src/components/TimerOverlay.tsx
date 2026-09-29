import React from "react";
import { Plus, X, Timer } from "lucide-react";

interface TimerOverlayProps {
  secondsLeft: number;
  onAddSeconds: (sec: number) => void;
  onStop: () => void;
}

export const TimerOverlay: React.FC<TimerOverlayProps> = ({ secondsLeft, onAddSeconds, onStop }) => {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const formatted = m + ":" + (s < 10 ? "0" : "") + s;

  return (
    <aside 
      aria-label="Rusttimer"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#161715] border border-[#9fe870]/40 text-white px-6 py-3.5 rounded-[24px] shadow-2xl shadow-black/80 flex items-center gap-4 animate-in fade-in"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#1e2e1a] text-[#9fe870] flex items-center justify-center">
          <Timer size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#868685] font-bold uppercase tracking-wider">Rest Timer</span>
          <span className="text-xl font-black font-mono tracking-tight text-[#9fe870]">{formatted}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-[#262824] pl-3">
        <button
          onClick={() => onAddSeconds(30)}
          className="bg-[#20221e] hover:bg-[#2c2f29] text-[#9fe870] px-3 py-1.5 rounded-[14px] text-xs font-bold flex items-center gap-1 transition"
        >
          <Plus size={12} /> 30s
        </button>
        <button
          onClick={onStop}
          className="w-8 h-8 rounded-full bg-[#2a1717] text-[#d03238] hover:bg-[#d03238] hover:text-white flex items-center justify-center font-bold text-xs transition"
          title="Stop timer"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};
