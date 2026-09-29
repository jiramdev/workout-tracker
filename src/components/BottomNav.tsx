import React from "react";
import { Dumbbell, ListOrdered, CalendarDays } from "lucide-react";

interface BottomNavProps {
  activeTab: "today" | "plans" | "schedule";
  onChangeTab: (tab: "today" | "plans" | "schedule") => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#161715]/90 backdrop-blur-xl border-t border-[#232521] px-6 py-3.5 flex justify-around max-w-lg mx-auto z-40">
      <button
        onClick={() => onChangeTab("today")}
        className={"flex flex-col items-center gap-1 transition " +
          (activeTab === "today" ? "text-[#9fe870] font-black" : "text-[#868685] font-medium hover:text-white")}
      >
        <Dumbbell size={20} />
        <span className="text-[11px] tracking-tight">Today</span>
      </button>

      <button
        onClick={() => onChangeTab("plans")}
        className={"flex flex-col items-center gap-1 transition " +
          (activeTab === "plans" ? "text-[#9fe870] font-black" : "text-[#868685] font-medium hover:text-white")}
      >
        <ListOrdered size={20} />
        <span className="text-[11px] tracking-tight">Routines</span>
      </button>

      <button
        onClick={() => onChangeTab("schedule")}
        className={"flex flex-col items-center gap-1 transition " +
          (activeTab === "schedule" ? "text-[#9fe870] font-black" : "text-[#868685] font-medium hover:text-white")}
      >
        <CalendarDays size={20} />
        <span className="text-[11px] tracking-tight">Schedule</span>
      </button>
    </nav>
  );
};
